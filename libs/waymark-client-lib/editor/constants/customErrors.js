/* eslint-disable max-classes-per-file */

/**
 * File defines custom error classes that we can throw in the editor which
 * give a stronger semantic indication of the nature of the error
 */

export class FileUploadLimitExceededError extends Error {
    constructor(assetType, ...params) {
        super(...params);

        this.assetType = assetType;
    }
}

export class VideoFileUploadLimitExceededError extends FileUploadLimitExceededError {
    constructor(
        message = 'Maximum number of simultaneous video uploads exceeded. Please wait for some uploads to finish and then try again.',
        ...params
    ) {
        super('video', message, ...params);
    }
}