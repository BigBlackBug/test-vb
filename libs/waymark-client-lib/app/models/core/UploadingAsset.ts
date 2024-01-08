import { uuid } from 'shared/utils/uuid.js';

/**
 * Class represent an asset that is currently being uploaded.
 *
 * @class UploadingAsset
 */
export default class UploadingAsset {
  shouldAutoIncrementProgress: boolean;
  uploadProgress: number;
  placeholderID: string;
  businessGUID: string | null;

  constructor(options: { shouldAutoIncrementProgress?: boolean; businessGUID?: string } = {}) {
    const { shouldAutoIncrementProgress = false, businessGUID = null } = options;

    this.shouldAutoIncrementProgress = shouldAutoIncrementProgress;
    this.uploadProgress = 0;
    this.placeholderID = `uploading-${uuid()}`;
    this.businessGUID = businessGUID;
  }
}
