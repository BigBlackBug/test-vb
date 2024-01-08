/* eslint-disable max-classes-per-file */
import { AudioProcessingService } from 'libs/audio-processing-sdk';
import { WaymarkServiceAccessKey } from 'libs/shared-types';

class AudioProcessingServiceSDK {
  private serviceAccessKey: WaymarkServiceAccessKey | null = null;
  private serviceInstance: AudioProcessingService | null = null;

  /**
   * Creates an instance of the AudioProcessingService if one does not already exist.
   *
   * @param {WaymarkServiceAccessKey} serviceAccessKey
   */
  private getServiceInstance(serviceAccessKey: WaymarkServiceAccessKey) {
    if (this.serviceInstance && serviceAccessKey === this.serviceAccessKey) {
      return this.serviceInstance;
    }

    this.serviceAccessKey = serviceAccessKey;
    this.serviceInstance = new AudioProcessingService(serviceAccessKey);

    return this.serviceInstance;
  }

  /**
   * Ensures we have an instance of the AudioProcessingService, uploads and processes audio file data,
   * and returns the result.
   *
   * @param {Uint8Array} audioData
   * @param {WaymarkServiceAccessKey} serviceAccessKey - The user's service access key, which should be available
   *                                                      via the `getServiceAccessToken` redux selector.
   */
  async processAudioData(
    audioData: Uint8Array,
    serviceAccessKey: WaymarkServiceAccessKey,
    duration?: number,
  ) {
    const service = this.getServiceInstance(serviceAccessKey);

    return service.processAudio(audioData, duration);
  }

  /**
   * Takes a File object uploaded by a user and uploads + processes it using the AudioProcessingService.
   *
   * @param {File} audioFile
   * @param {WaymarkServiceAccessKey} serviceAccessKey - The user's service access key, which should be available
   *                                                      via the `getServiceAccessToken` redux selector.
   */
  async processAudioFile(audioFile: File, serviceAccessKey: WaymarkServiceAccessKey) {
    const audioArrayBuffer = await audioFile.arrayBuffer();
    return this.processAudioData(new Uint8Array(audioArrayBuffer), serviceAccessKey);
  }

  /**
   * Returns the URL for an Audio Asset using the Audio Processing Service
   *
   * @param {string} derivative - which derivative of the audio clip to return
   * @param {string} sourceKey - the source key for the desired audio clip
   * @param {WaymarkServiceAccessKey} serviceAccessKey - The user's service access key, which should be available
   *                                                      via the `getServiceAccessToken` redux selector.
   */
  async getAudioAssetURL(
    derivative: string,
    sourceKey: string,
    serviceAccessKey: WaymarkServiceAccessKey,
  ) {
    const service = this.getServiceInstance(serviceAccessKey);
    return service.getAudioAssetURL(derivative, sourceKey);
  }
}

const audioProcessingService = new AudioProcessingServiceSDK();
export default audioProcessingService;
