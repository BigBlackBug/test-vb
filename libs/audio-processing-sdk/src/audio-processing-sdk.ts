import axios from 'axios';

// Local
import { AxiosSignedConnectionSource } from 'libs/service-access-lib';
import { ServiceDiscoverySDK } from 'libs/service-discovery-sdk';
import { Service, SignedConnectionSource, WaymarkServiceAccessKey } from 'libs/shared-types';

export interface GetSignedURLResponse {
  url: string;
  sourceKey: string;
}

export interface ProcessAudioRequest {
  sourceKey: string;
  duration?: number;
}

export interface ProcessedAudio {
  sourceKey: string;
  duration: number;
}

export class AudioProcessingService {
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

  /**
   * Gets the URL for the given API endpoint using the base URL for the audio processing service.
   */
  protected async getAudioProcessingServiceURL(path: string): Promise<string> {
    const serviceConfiguration = await this.getServiceConfiguration();
    return new URL(path, serviceConfiguration.baseURL).toString();
  }

  /**
   * Gets the URL for an audio asset.
   */
  public async getAudioAssetURL(derivative: string, sourceKey: string): Promise<string> {
    const serviceConfiguration = await this.getServiceConfiguration();
    return `https://${serviceConfiguration.bucket}.s3.${serviceConfiguration.region}.amazonaws.com/assets/audio/derivatives/${derivative}/${sourceKey}_${derivative}.m4a`;
  }

  /**
   * Ask the audio processing service for a signed URL to which audio can be uploaded.
   */
  protected async getSignedURL(): Promise<GetSignedURLResponse> {
    const connection = await this.connectionSource.getSignedConnection();
    const response = await connection.get(await this.getAudioProcessingServiceURL('/getSignedURL'));
    return response.data;
  }

  /**
   * Uploads an audio file for processing.
   */
  protected async uploadAudio(audio: Uint8Array): Promise<string> {
    // Get a signed URL to which we can upload the audio.
    const response = await this.getSignedURL();
    // Upload the audio.
    await axios.put(response.url, audio);
    return response.sourceKey;
  }

  /**
   * Submit the voice over audio to the audio processing service.
   */
  protected async invokeProcessing(sourceKey: string, duration?: number): Promise<ProcessedAudio> {
    const processAudioURL = await this.getAudioProcessingServiceURL('/processAudio');
    const connection = await this.connectionSource.getSignedConnection();
    const request = { sourceKey, duration };
    const response = await connection.post(processAudioURL, request);
    // The duration of both derivatives *should* be the same, though there is the possibility that
    // ffmpeg and the audio processing service could produce slightly different durations for
    // each. This has not been the case in testing so far. If we ever follow up on scene-based VO,
    // we might want to rethink inferring derivatives from source key, and manage them and their
    // metadata more concretely and precisely. For now, we'll just call the VO duration the
    // duration of the download render version.
    return {
      sourceKey,
      duration: response.data.downloadRenderVersion.duration,
    };
  }

  /**
   * Request processing of the given audio, with the desired duration.
   */
  public async processAudio(audio: Uint8Array, duration?: number) {
    const sourceKey = await this.uploadAudio(audio);
    return this.invokeProcessing(sourceKey, duration);
  }

  // This will be called by the Waymark Renderer asset plugin.
  // NOTES:
  //    - The renderer needs to be initialized with a WaymarkServiceAccessKey in the browser to
  //      give to the APS SDK.
  //    - Do we need this in the Studio?
  //    - In the TRS, the rendering stage needs to intialize the renderer as well.
  public async getAssetBucket(): Promise<string> {
    const serviceConfiguration = await this.getServiceConfiguration();
    return serviceConfiguration.bucket as string;
  }

  // Since we can't do async calls in a constructor, use an accessor instead.
  async getServiceConfiguration() {
    if (!this.serviceConfiguration) {
      const serviceDiscovery = new ServiceDiscoverySDK(this.serviceAccessKey);
      this.serviceConfiguration = await serviceDiscovery.discoverService('AudioProcessing');
    }
    return this.serviceConfiguration;
  }
}
