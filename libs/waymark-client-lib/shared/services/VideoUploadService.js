/* eslint-disable max-classes-per-file */
import videoProcessingService, {
    maxUploadingProgressDuration,
    progressUpdateInterval,
} from 'shared/web_video/utils/videoProcessingService';

// This is the maximum amount of simultaneous uploads that can be happening at once.
// We decided on this number based on performance and what we think the best UX is.
const MAX_UPLOAD_COUNT = 10;

class MaxFileUploadExceededError extends Error {
    constructor(message = 'Maximum number of simultaneous video uploads exceeded', ...params) {
        super(message, ...params);
    }
}

/**
 * Service provides basic video uploading and processing via the VideoProcessingService.
 * Service also manages the maximum number of parallel uploads.
 */
class VideoUploadService {#
    numUploadingVideos = 0;

    constructor(maxSimultaneousUploadCount = MAX_UPLOAD_COUNT) {
        this.maxSimultaneousUploadCount = maxSimultaneousUploadCount;
    }

    /**
     * Upload a video asset to S3 and process it via the VideoProcessingService
     *
     * @param {File} videoFile    Video file to upload and process
     * @param {funcion} onProgressUpdate    Callback
     * @returns {object} sourceVideoKey    VideoProcessingService key for newly uploaded asset
     */
    async uploadVideoAsset(videoFile, onProgressUpdate) {
        if (this.#numUploadingVideos >= this.maxSimultaneousUploadCount) {
            throw new MaxFileUploadExceededError();
        }

        this.#numUploadingVideos += 1;

        const sourceVideoKey = await videoProcessingService.uploadSourceVideo(videoFile, {
            onProgress({
                progress
            }) {
                // This is the first of two steps that make up the upload progress
                // bar. We're dividing by two so that each step reprsents half of the bar.
                onProgressUpdate(progress / 2);
            },
        });

        await videoProcessingService.bulkProcessSourceVideo(sourceVideoKey, 'webPlayerFastv1', {
            onProgress({
                progress
            }) {
                // This is the second of two steps that make up the upload progress
                // bar. We're dividing by two so that each step reprsents half of the bar,
                // and since this is the second step we're starting at 50%.
                onProgressUpdate(0.5 + progress / 2);
            },
            // Processing progress is simulated in the VPS for now, and setting the following parameters
            // allows us to control the max processing time and the frequency at which we get updates.
            simulatedProgressDuration: maxUploadingProgressDuration,
            simulatedProgressDurationFrequency: progressUpdateInterval,
        });

        const videoMetadata = await videoProcessingService.analyzeProcessedOutput(
            sourceVideoKey,
            'master',
        );

        this.#numUploadingVideos = this.#numUploadingVideos - 1;

        return {
            uploadKey: sourceVideoKey,
            width: videoMetadata.width,
            height: videoMetadata.height,
            length: videoMetadata.duration,
        };
    }
}

export default new VideoUploadService();