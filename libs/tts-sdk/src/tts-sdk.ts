import { Base64 } from 'js-base64';
import _ from 'lodash';

// Local
import { AxiosSignedConnectionSource } from 'libs/service-access-lib';
import { ServiceDiscoverySDK } from 'libs/service-discovery-sdk';
import { Service, SignedConnectionSource, WaymarkServiceAccessKey } from 'libs/shared-types';
import { Speaker, SpeakerData, SpeakerMap } from 'libs/tts-lib';
import { getLogger } from 'libs/logging-ts';

export class TextToSpeechService {
  private serviceAccessKey: WaymarkServiceAccessKey;
  private connectionSource: SignedConnectionSource;
  private serviceConfiguration: Service | null = null;

  /**
   * This SDK needs to be initialized with a WaymarkServiceAccessKey.  If you are in the Ivory
   * environment, this key can be obtained by calling the /api/v3/service-access/
   * endpoint. Logged in users will be provided with an identity that is permitted to call most
   * services. Anonymous users will be permitted to call only the service discovery endpoint
   * and any API gateway URL whose path begins with `/open/`.
   *
   * For more details on these permissions, see WaymarkApplication[Un]AuthenticatedUserRole in
   * `/apps/shared-infrastructure/template.yaml`.
   *
   * If you are using this SDK in a Waymark service environment, use `getLocalServiceAccessKey`
   * in `service-discovery-lib`. The key provided will give access to the services explicitly
   * permitted in the policy definition of the invoking service, such as the Lambda function
   * definition.
   */
  constructor(serviceAccessKey: WaymarkServiceAccessKey) {
    this.serviceAccessKey = serviceAccessKey;
    this.connectionSource = new AxiosSignedConnectionSource(serviceAccessKey.identity);
  }

  // Since we can't do async calls in a constructor, use an accessor instead.
  async getServiceConfiguration() {
    if (!this.serviceConfiguration) {
      const serviceDiscovery = new ServiceDiscoverySDK(this.serviceAccessKey);
      this.serviceConfiguration = await serviceDiscovery.discoverService('TextToSpeech');
    }
    return this.serviceConfiguration;
  }

  /**
   * Choose a speaker for the given text and duration.
   */
  public async chooseSpeaker(
    text: string,
    duration: number,
    context: string = '',
  ): Promise<Speaker> {
    const logger = getLogger({ metadata: { service: 'TextToSpeechService.getSpeaker' } });
    const url = await this.getTextToSpeechURL('speakers/selections');
    const connection = await this.connectionSource.getSignedConnection();

    const request = {
      text,
      duration,
      context,
    };

    const response = await connection.post(url, request);
    logger.debug('TTS /speakers/selections response', { speakerData: response.data });
    const speakerData = response.data.speaker;
    return new Speaker(speakerData);
  }

  /**
   * Get a single speaker from the text-to-speech service.
   */
  public async getSpeaker(id: string): Promise<Speaker> {
    const logger = getLogger({ metadata: { service: 'TextToSpeechService.getSpeaker' } });
    const speakerURL = await this.getTextToSpeechURL(`speaker/${id}`);
    const connection = await this.connectionSource.getSignedConnection();

    const response = await connection.get(speakerURL);
    const speakerData = response.data.speaker;
    logger.debug('TTS /speaker response', { speakerData: response.data, speakerID: id });
    return new Speaker(speakerData);
  }

  /**
   * Get the list of supported speakers from the text-to-speech service.
   */
  public async getSpeakers(): Promise<SpeakerMap> {
    const logger = getLogger({ metadata: { service: 'TextToSpeechService.getSpeakers' } });
    const speakersURL = await this.getTextToSpeechURL('speakers');
    const connection = await this.connectionSource.getSignedConnection();

    const response = await connection.get(speakersURL);

    const speakerRecords: Record<string, SpeakerData> = response.data.speakers satisfies Record<
      string,
      SpeakerData
    >;
    logger.debug('getSpeakers speakerRecords', { speakerRecords: speakerRecords });

    const speakers: SpeakerMap = new SpeakerMap();
    Object.values(speakerRecords).forEach((speakerRecord) => {
      speakers.set(speakerRecord.id, new Speaker(speakerRecord));
    });
    logger.debug('getSpeakers result', { speakers });
    return speakers;
  }

  /**
   * Gets the URL for the given API endpoint using the base URL for the text-to-speech service.
   */
  protected async getTextToSpeechURL(path: string): Promise<string> {
    const serviceConfiguration = await this.getServiceConfiguration();
    return new URL(path, serviceConfiguration.baseURL).toString();
  }

  /**
   * Get a preview of a speaker from the text-to-speech service.
   */
  public async previewSpeaker(id: string): Promise<Speaker> {
    const speakerURL = await this.getTextToSpeechURL(`speaker/${id}/preview`);
    const connection = await this.connectionSource.getSignedConnection();

    const response = await connection.get(speakerURL);
    return response.data.preview;
  }

  /**
   * Request text-to-speech service for the voice over script.
   */
  public async textToSpeech(voiceOverScript: string, speakerID: string): Promise<Uint8Array> {
    if (!voiceOverScript) {
      const errorMessage = 'No voice over script provided';
      throw new Error(errorMessage);
    }

    if (!speakerID) {
      const errorMessage = 'No speaker ID provided';
      throw new Error(errorMessage);
    }

    const ttsURL = await this.getTextToSpeechURL('tts');
    const connection = await this.connectionSource.getSignedConnection();

    const request = {
      text: voiceOverScript,
      speakerID: speakerID,
    };

    const response = await connection.post(ttsURL, request);

    return Base64.toUint8Array(response.data.audio);
  }
}
