import videoProcessingService from 'shared/web_video/utils/videoProcessingService';

/**
 * Base class defining standardized properties and methods that should be available on all video assets
 * displayed in the user's libraries
 *
 * @class BaseVideoAsset
 */
export default class BaseVideoAsset {
    constructor({
        guid,
        removedAt,
        updatedAt,
        width,
        height,
        length,
        uploadKey
    }) {
        this.guid = guid;
        this.removedAt = removedAt;
        this.updatedAt = updatedAt;

        this.width = width;
        this.height = height;
        this.length = length;
        this.uploadKey = uploadKey;

        // Use the second thumbnail to avoid a blank or non-representative image.
        // eslint-disable-next-line prefer-destructuring
        this.thumbnailImageURL = videoProcessingService.describeProcessedOutput(
            uploadKey,
            'tenThumbnails_jpg300',
        ).locations[1];
    }
}