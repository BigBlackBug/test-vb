// Shared
import {
    apolloClient
} from 'shared/api/graphql';

// Editor
import {
    assetTypes
} from 'editor/constants/mediaLibraries.js';
import BaseVideoAsset from './BaseVideoAsset.js';
import {
    removeStockVideo,
    restoreRemovedStockVideo,
} from 'shared/api/graphql/stockVideoLibraries/mutations';

/**
 * Class takes a serialized StockVideoLibraryVideo record returned from the GraphQL API and
 * stores its data in a standardized format and provides management methods for
 * removing/restoring the asset to its library
 *
 * @class StockVideoAsset
 */
export default class StockVideoAsset extends BaseVideoAsset {
    constructor({
        owner,
        ...videoAssetData
    }) {
        super({
            guid: videoAssetData.guid,
            removedAt: videoAssetData.removedAt,
            updatedAt: videoAssetData.updatedAt,
            width: videoAssetData.stockAsset.width,
            height: videoAssetData.stockAsset.height,
            length: videoAssetData.stockAsset.length,
            uploadKey: videoAssetData.stockAsset.vpsKey,
        });

        this.assetSource = videoAssetData.stockAsset.source;
        this.assetSourceID = videoAssetData.stockAsset.sourceAssetId;

        this.owner = owner;
        this.type = assetTypes.stock;

        // Bind the remove/restore methods to ensure they work correctly
        // when called from event handlers
        this.remove = this.remove.bind(this);
        this.restore = this.restore.bind(this);
    }

    /**
     * Removes this asset from its library
     */
    async remove(refetchQuery) {
        await removeStockVideo(this.guid);
        if (refetchQuery) {
            await apolloClient.refetchQueries([refetchQuery]);
        }
    }

    /**
     * Restores this asset to its library, if it was removed
     */
    async restore(refetchQuery) {
        await restoreRemovedStockVideo(this.guid);
        if (refetchQuery) {
            await apolloClient.refetchQueries([refetchQuery]);
        }
    }
}