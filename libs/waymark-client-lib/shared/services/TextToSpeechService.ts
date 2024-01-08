import { WaymarkServiceAccessKey } from 'libs/shared-types';
import { Speaker, SpeakerMap } from 'libs/tts-lib';
import { TextToSpeechService } from 'libs/tts-sdk';

class TextToSpeechServiceSDK {
  private serviceAccessKey: WaymarkServiceAccessKey | null = null;
  private serviceInstance: TextToSpeechService | null = null;

  /**
   * Creates an instance of the TextToSpeechService if one does not already exist.
   *
   * @param {WaymarkServiceAccessKey} serviceAccessKey
   */
  private getServiceInstance(serviceAccessKey: WaymarkServiceAccessKey) {
    if (this.serviceInstance && serviceAccessKey === this.serviceAccessKey) {
      return this.serviceInstance;
    }

    this.serviceAccessKey = serviceAccessKey;
    this.serviceInstance = new TextToSpeechService(serviceAccessKey);

    return this.serviceInstance;
  }

  /**
   * Ensures we have an instance of the TextToSpeechService, returns a SpeakerMap.
   *
   * @param {WaymarkServiceAccessKey} serviceAccessKey - The user's service access key, which should be available
   *                                                      via the `getServiceAccessToken` redux selector.
   */
  async getSpeakers(serviceAccessKey: WaymarkServiceAccessKey): Promise<SpeakerMap> {
    const service = this.getServiceInstance(serviceAccessKey);
    return service.getSpeakers();
  }

  /**
   * Ensures we have an instance of the TextToSpeechService, returns a Speaker.
   *
   * @param {string} id - The ID of the speaker to be returned
   * @param {WaymarkServiceAccessKey} serviceAccessKey - The user's service access key, which should be available
   *                                                      via the `getServiceAccessToken` redux selector.
   */
  async getSpeaker(id: string, serviceAccessKey: WaymarkServiceAccessKey): Promise<Speaker> {
    const service = this.getServiceInstance(serviceAccessKey);
    return service.getSpeaker(id);
  }

  /**
   * Ensures we have an instance of the TextToSpeechService, returns a UintArray8 of the voice over.
   *
   * @param {string} voiceOverScript - The script for the voice over
   * @param {string} speakerId - The ID of the speaker to use for the voice over
   * @param {WaymarkServiceAccessKey} serviceAccessKey - The user's service access key, which should be available
   *                                                      via the `getServiceAccessToken` redux selector.
   */
  async textToSpeech(
    voiceOverScript: string,
    speakerID: string,
    serviceAccessKey: WaymarkServiceAccessKey,
  ) {
    const service = this.getServiceInstance(serviceAccessKey);
    return service.textToSpeech(voiceOverScript, speakerID);
  }
}

export default new TextToSpeechServiceSDK();
