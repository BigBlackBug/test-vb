/**
 * Class defines standard properties the Editor expects a video library to have and houses
 * video assets.
 *
 * @class VideoLibrary
 */
export default class VideoLibrary {
    constructor({
        slug,
        displayName,
        canUpload,
        isInitiallyExpanded,
        shouldDisplaySectionHeader,
        videoAssets = [],
    }) {
        this.slug = slug;
        this.displayName = displayName;
        this.videoAssets = videoAssets;
        this.canUpload = canUpload;
        this.isInitiallyExpanded = isInitiallyExpanded;
        this.shouldDisplaySectionHeader = shouldDisplaySectionHeader;
    }
}