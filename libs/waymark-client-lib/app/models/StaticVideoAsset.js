import BaseVideoAsset from './BaseVideoAsset.js';

/**
 * Class represents a video asset that cannot be removed or restored.
 *
 * TODO: The API responsible for loading account group assets (currently the only video assets
 * that cannot be restored or removed) has not been converted to GraphQL yet, and the
 * constructor will need to updated once it is.
 *
 * @class StaticVideoAsset
 */
export default class StaticVideoAsset extends BaseVideoAsset {
    constructor(videoAssetData) {
        super({
            guid: videoAssetData.guid,
            uploadKey: videoAssetData.upload_key,
            width: videoAssetData.width,
            height: videoAssetData.height,
            length: videoAssetData.length,
        });

        this.displayName = videoAssetData.display_name;
        this.order = videoAssetData.order;
    }
}