import crypto from 'crypto';
import * as path from 'path';

import { getLogger, Logger, Timer } from 'libs/logging-ts';
import { S3Resource } from 'libs/shared-types';
import {
  constructS3URL,
  doesFileExistInS3,
  downloadS3Resource,
  uploadFileToS3,
} from 'libs/util-s3';
import { Speaker, SpeakerMap, TextToSpeechProvider } from './base';
import { ProviderConfiguration } from './configuration';

export interface SpeakerPreviewLocator {
  location: S3Resource;
  url: string;
}

export const enum TTSACL {
  Private = 'private',
  Public = 'public-read',
}

export abstract class CachingTextToSpeechProvider implements TextToSpeechProvider {
  protected _logger: Logger;

  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  protected async callProvider(text: string, speaker: Speaker, timeout: number): Promise<Buffer> {
    throw new Error(
      'The callProvider method should be implemented in each CachingTextToSpeechProvider subclass.',
    );
  }

  constructor() {
    this._logger = getLogger({ metadata: { service: this.getName() } });
  }

  get logger(): Logger {
    return this._logger;
  }

  constructS3Path(...pathComponents: string[]): string {
    return path.join('services/tts', this.getName(), ...pathComponents);
  }

  getConfiguration(): Promise<ProviderConfiguration> {
    throw new Error('Method not implemented.');
  }

  getName(): string {
    throw new Error(
      'The getName method should be implemented in each CachingTextToSpeechProvider subclass.',
    );
  }

  getSpeakerPreviewLocator(speaker: Speaker): SpeakerPreviewLocator {
    const location = {
      bucket: this.getTextToSpeechBucket(),
      key: this.constructS3Path(speaker.id, 'preview.mp3'),
      region: process.env.AWS_REGION,
    };
    const url = constructS3URL(location);
    return { location, url };
  }

  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  getSpeaker(speakerID: string): Speaker | null {
    throw new Error(
      'The getSpeaker method should be implemented in each CachingTextToSpeechProvider subclass.',
    );
  }

  /**
   * This we get from the environment, not the configuration, because it's not provider-specific and
   * needs to be synchronized with the policies in the CloudFormation template.
   */
  getTextToSpeechBucket(): string {
    if (!process.env.ASSET_BUCKET) {
      throw new Error('No S3 bucket defined for text-to-speech cache.');
    }
    return process.env.ASSET_BUCKET;
  }

  getSpeakers(): SpeakerMap {
    throw new Error(
      'The getSpeakers method should be implemented in each CachingTextToSpeechProvider subclass.',
    );
  }

  /* eslint-disable-next-line @typescript-eslint/no-empty-function */
  async initialize(): Promise<void> {}

  async previewSpeaker(
    speakerID: string,
    timeout: number,
    overwrite: boolean = false,
  ): Promise<Speaker> {
    const configuration = await this.getConfiguration();

    const speaker = this.getSpeaker(speakerID);

    if (!speaker) {
      this.logger.error('previewSpeaker: No such speaker', { speakerID, provider: this });
      throw new Error(`No speaker found with ID "${speakerID}"`);
    }

    const { location, url } = this.getSpeakerPreviewLocator(speaker);

    speaker.previewURL = url;

    const shouldCreatePreview = overwrite || (await doesFileExistInS3(location)) == false;
    if (shouldCreatePreview) {
      this.logger.debug('Creating new preview', { speaker, location });
      await this.textToSpeech(
        configuration.previewText[speaker.language.code] ||
          configuration.previewText[speaker.language.getBaseLanguageCode()],
        speakerID,
        timeout,
        location,
        overwrite,
        TTSACL.Public,
      );
    } else {
      this.logger.debug('Not overwriting existing preview.', { speaker, location });
    }

    return speaker;
  }

  async textToSpeech(
    text: string,
    speakerID: string,
    timeout: number,
    location?: S3Resource,
    overwrite: boolean = false,
    acl: TTSACL = TTSACL.Private,
  ): Promise<Buffer> {
    const timer = new Timer(this.logger.configuration);
    let audio: Buffer;
    try {
      const speaker = this.getSpeaker(speakerID);
      if (!speaker) {
        throw new Error(`Unrecognized speaker ID: ${speakerID}`);
      }
      const audioS3Location = location || (await this.getAudioS3Location(speakerID, text));

      const cacheCheck = new Timer(this.logger.configuration);
      const audioExists = await doesFileExistInS3(audioS3Location);
      cacheCheck.debug(`cache check completed: cached audio ${audioExists ? '' : 'not '}found`);
      if (audioExists && !overwrite) {
        this.logger.debug('Returning cached audio', { location: audioS3Location });
        audio = await downloadS3Resource(audioS3Location);
      } else {
        this.logger.debug('Calling provider', { text: text, speakerID: speakerID });
        const providerCall = new Timer(this.logger.configuration);
        audio = await this.callProvider(text, speaker, timeout);
        providerCall.debug('callProvider completed');

        this.logger.debug('Caching audio', {
          text,
          speakerID,
          audioS3Location,
          acl,
        });
        await this.cacheAudio(audio, audioS3Location, acl);
      }
      return audio;
    } finally {
      timer.debug('textToSpeech finished');
    }
  }

  protected async getAudioS3Location(speakerID: string, text: string): Promise<S3Resource> {
    const bucket = this.getTextToSpeechBucket();
    const key = this.constructS3Path(
      speakerID,
      crypto.createHash('sha256').update(text).digest('hex') + '.mp3',
    );
    const audioS3Location = {
      bucket: bucket,
      key: key,
    };
    return audioS3Location;
  }

  async cacheAudio(
    audio: Buffer,
    location: S3Resource,
    acl: TTSACL = TTSACL.Private,
  ): Promise<void> {
    const timer = new Timer(this.logger.configuration);
    await uploadFileToS3({
      fileData: audio,
      key: location.key,
      bucket: location.bucket,
      acl,
    });

    timer.debug('cacheAudio finished');
  }
}
