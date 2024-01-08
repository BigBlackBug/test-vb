// @ts-expect-error - VPS SDK is not typed
import { VideoProcessingService } from '@stikdev/video-processing-service-sdk';

// Processing progress is simulated in the VPS, so for now we can use the following values to
// control the max processing time and the frequency at which we get updates.
// Max processing time is 3 minutes
export const maxUploadingProgressDuration = 180000;
// Get updates every .5 seconds
export const progressUpdateInterval = 500;

class VideoProcessingServiceSDK {
  private serviceInstance: VideoProcessingService;
  private isAuthenticated = false;

  // TODO: This is currently harcoded. It has to be until we have client-side service discovery
  private websocketEndpoint = 'wss://mdlgolkxaf.execute-api.us-east-2.amazonaws.com/Prod';

  constructor() {
    this.serviceInstance = new VideoProcessingService({
      websocketEndpoint: this.websocketEndpoint,
    });
  }

  private async ensureServiceIsAuthenticated() {
    if (!this.isAuthenticated) {
      await this.serviceInstance.authenticate();
      this.isAuthenticated = true;
    }
  }

  async verifyProcessedOutput(sourceVideoKey: string) {
    await this.ensureServiceIsAuthenticated();
    return this.serviceInstance.verifyProcessedOutput(sourceVideoKey);
  }

  async uploadSourceVideo(videoFile: File): Promise<string> {
    await this.ensureServiceIsAuthenticated();
    return this.serviceInstance.uploadSourceVideo(videoFile);
  }

  async bulkProcessSourceVideo(
    sourceVideoKey: string,
    bulkProcessingJobKey: string,
    options?: {
      onProgress?: (progressObject: { progress: number }) => void;
      simulatedProgressDuration?: number;
      simulatedProgressDurationFrequency?: number;
    },
  ) {
    await this.ensureServiceIsAuthenticated();
    return this.serviceInstance.bulkProcessSourceVideo(
      sourceVideoKey,
      bulkProcessingJobKey,
      options,
    );
  }

  async analyzeProcessedOutput(
    sourceVideoKey: string,
    processingDefinitionKey: string,
  ): Promise<{
    width: number;
    height: number;
    duration: number;
  }> {
    await this.ensureServiceIsAuthenticated();
    return this.serviceInstance.analyzeProcessedOutput(sourceVideoKey, processingDefinitionKey);
  }

  describeProcessedOutput(
    sourceVideoKey: string,
    processingDefinitionKey: string,
  ): Promise<{
    locations: string[];
  }> {
    return this.serviceInstance.describeProcessedOutput(sourceVideoKey, processingDefinitionKey);
  }
}

const videoProcessingService = new VideoProcessingServiceSDK();
export default videoProcessingService;
