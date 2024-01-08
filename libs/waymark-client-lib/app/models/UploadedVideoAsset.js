// Waymark app dependencies
import {
    updateVideoAsset
} from 'app/hooks/videoLibraries.js';

// Local
import {
    assetTypes
} from 'editor/constants/mediaLibraries.js';
import BaseVideoAsset from './BaseVideoAsset.js';

// Waymark app dependencies

/**
 * Class takes a serialized VideoAssetLibraryVideo record returned from the GraphQL API and
 * stores its data in a standardized format for use in the Editor.
 *
 * @class UploadedVideoAsset
 */
export default class UploadedVideoAsset extends BaseVideoAsset {
    constructor({
        owner,
        ...videoAssetData
    }) {
        super({
            guid: videoAssetData.guid,
            uploadKey: videoAssetData.uploadKey,
            removedAt: videoAssetData.removedAt,
            updatedAt: videoAssetData.updatedAt,
            width: videoAssetData.width,
            height: videoAssetData.height,
            length: videoAssetData.length,
        });

        this.owner = owner;
        this.type = assetTypes.userUpload;

        this.remove = this.remove.bind(this);
        this.restore = this.restore.bind(this);
    }

    async remove(updateDependencies) {
        return updateVideoAsset({
                guid: this.guid,
                shouldRemove: true,
            },
            updateDependencies,
        );
    }

    restore(updateDependencies) {
        return updateVideoAsset({
                guid: this.guid,
                shouldRestore: true,
            },
            updateDependencies,
        );
    }
}