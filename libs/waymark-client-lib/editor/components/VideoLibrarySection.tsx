// Vendor
import _ from 'lodash';
import { useEffect, useRef, useState, useMemo, Dispatch, SetStateAction } from 'react';
import HoverVideoPlayer from 'react-hover-video-player';
import { css } from '@emotion/css';

// Shared UI
import { DotLoader } from '@libs/shared-ui-components';
import { themeVars } from '@libs/shared-ui-styles';

// Editor
import EditorCollapsibleLibrarySection from 'editor/components/EditorCollapsibleLibrarySection.js';
import EditorFileUploadButton from 'editor/components/EditorFileUploadButton';
import EditorFileUploadPlaceholder from 'editor/components/EditorFileUploadPlaceholder';
import { maxSimultaneousUploadCount } from 'editor/constants/EditorVideo.js';
import { useEditorMediaLibraries } from 'editor/providers/EditorMediaLibrariesProvider.js';
import { assetOwnerTypes } from 'editor/constants/mediaLibraries.js';
import { AssetLibraryItemButton } from 'editor/components/AssetLibraryItemButton';
import { AssetLibraryItemBadge } from 'editor/components/AssetLibraryItemBadge';
import { AssetLibraryItemToolbarButton } from 'editor/components/AssetLibraryItemToolbarButton';

// Shared
import FuzzySearchBar from 'shared/components/FuzzySearchBar';
import videoUploadService from 'shared/services/VideoUploadService.js';
import ProgressiveImage from 'shared/components/ProgressiveImage';

// Waymark App Dependencies
import VideoLibrary from 'app/models/VideoLibrary.js';
import { useIsWindowMobile } from 'app/hooks/windowBreakpoint.js';
import { CloseIcon } from 'app/icons/BasicIcons';
import { useEditorBusinessDetailContext } from 'app/components/EditPage/providers/BusinessDetailProvider';
import UploadingAsset from 'app/models/core/UploadingAsset';
import StaticVideoAsset from 'app/models/StaticVideoAsset.js';
import StockVideoAsset from 'app/models/StockVideoAsset.js';
import UploadedVideoAsset from 'app/models/UploadedVideoAsset.js';

// Styles
import { whiteColor } from 'styles/themes/waymark/colors.js';
import { useVideoAssetURL } from 'shared/web_video/hooks/useVideoAssetURL';

interface EditorVideoLibraryItemProps {
  // The video asset to display
  videoAsset: UploadedVideoAsset | StockVideoAsset | StaticVideoAsset;
  // Function to be called when item is clicked/selected
  onClickLibraryVideo?:
    | ((videoAsset: UploadedVideoAsset | StockVideoAsset | StaticVideoAsset) => void)
    | null;
  // Whether or not the video asset is used in any configuration value
  isInUse?: boolean;
  // Whether or not the video asset is selected
  isSelected?: boolean;
  refreshBusinessVideoCountQuery?: any;
}

/**
 * Renders a hover preview or thumbnail image for a given Account or library video asset
 * and allows the user to select the video asset for use in the editor.
 * Assets comes formatted with functions to add or remove from their library.
 */
function EditorVideoLibraryItem({
  videoAsset,
  onClickLibraryVideo = null,
  isInUse = false,
  isSelected = false,
  refreshBusinessVideoCountQuery = null,
}: EditorVideoLibraryItemProps) {
  const hoverPreviewRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsWindowMobile();

  const videoSrc = useVideoAssetURL(videoAsset.uploadKey);

  const thumbnailAspectRatio = 1;
  const containerAspectRatio = _.get(videoAsset, 'width', 1) / _.get(videoAsset, 'height', 1);
  const width =
    containerAspectRatio >= thumbnailAspectRatio
      ? '100%'
      : `${(100 / thumbnailAspectRatio) * containerAspectRatio}%`;
  const height =
    containerAspectRatio <= thumbnailAspectRatio
      ? '100%'
      : `${(100 * thumbnailAspectRatio) / containerAspectRatio}%`;

  // Round the asset length to a max of 1 decimal point of precision
  const roundedAssetLength = Math.floor(videoAsset.length * 10) / 10;

  // Display the video length and in use tag (when applicable) on top of the hover preview and thumbnail.
  const videoDurationOverlay = (
    <div
      className={css`
        position: absolute;
        bottom: 0;
        right: 0;
        font-weight: ${themeVars.font.weight.heavy};
        color: ${whiteColor};
        background-color: rgba(0, 0, 0, 0.75);
        border-radius: 2px;
        font-size: 8px;
        line-height: 19px;
        margin: 0 4px 4px 0;
        padding: 0 4px;
      `}
    >
      {roundedAssetLength}s
    </div>
  );

  // Removes the asset from its library if it's removable
  const removeAsset =
    'remove' in videoAsset
      ? () =>
          videoAsset.remove(
            videoAsset.owner === assetOwnerTypes.business ? refreshBusinessVideoCountQuery : null,
          )
      : null;

  // Construct the action button configs for the mobile long-press action modal
  const longPressModalActionConfigs = [
    onClickLibraryVideo
      ? {
          action: () => onClickLibraryVideo(videoAsset),
          actionName: isSelected ? 'Selected' : 'Select',
          buttonProps: {
            // Disable the select button if the asset is already selected
            isDisabled: isSelected,
          },
        }
      : null,
    removeAsset
      ? {
          action: removeAsset,
          actionName: isInUse ? 'In use' : 'Remove',
          buttonProps: {
            colorTheme: 'Negative',
            isDisabled: isInUse,
          },
        }
      : null,
  ];

  return (
    <AssetLibraryItemButton
      // Primary action applies the video asset to the configuration,
      // or if the asset is already in use, opens the edit tab.
      onClick={() => onClickLibraryVideo?.(videoAsset)}
      isDisabled={!onClickLibraryVideo && _.isEmpty(longPressModalActionConfigs)}
      isSelected={isSelected}
      assetDisplayName={'displayName' in videoAsset ? videoAsset.displayName : null}
      actionModalTitle="Video Actions"
      longPressModalActionConfigs={longPressModalActionConfigs}
      toolbarButtons={
        <>
          {/* If this asset is removable, render a toolbar button to remove it */}
          {removeAsset ? (
            <AssetLibraryItemToolbarButton
              onClick={removeAsset}
              tooltipText={isInUse ? 'In use' : 'Remove'}
              // The button is disabled if the asset is in use
              isDisabled={isInUse}
            >
              <CloseIcon />
            </AssetLibraryItemToolbarButton>
          ) : null}
        </>
      }
      overlayBadges={
        <>
          {/* If this video asset is being used in the video, show an "in use" badge */}
          {isInUse ? <AssetLibraryItemBadge>in use</AssetLibraryItemBadge> : null}
        </>
      }
      ref={hoverPreviewRef}
      className={css`
        user-select: none;

        img {
          /* Disable iOS Safari's disruptive long-press image interaction */
          pointer-events: none;
        }
      `}
    >
      {isMobile || !videoSrc ? (
        <ProgressiveImage
          imageWrapperClassName={css`
            border-radius: 2px;
            overflow: hidden;
          `}
          src={videoAsset.thumbnailImageURL}
          alt="Library video"
          overlay={videoDurationOverlay}
        />
      ) : (
        <HoverVideoPlayer
          sizingMode="container"
          videoSrc={videoSrc}
          hoverTarget={hoverPreviewRef}
          overlayTransitionDuration={400}
          restartOnPaused
          unloadVideoOnPaused
          className={css`
            position: relative;
            height: 100%;
            width: 100%;
            cursor: pointer;
            border-radius: 2px;
            overflow: hidden;
          `}
          pausedOverlay={
            <ProgressiveImage
              src={videoAsset.thumbnailImageURL}
              alt="Video library asset"
              shouldCoverContainer
              overlay={videoDurationOverlay}
            />
          }
          loadingOverlay={
            <DotLoader
              className={css`
                width: 52px;
                color: ${whiteColor};
              `}
            />
          }
          loadingOverlayWrapperClassName={css`
            display: flex;
            justify-content: center;
            align-items: center;
            background-color: rgba(0, 0, 0, 0.5);
          `}
          crossOrigin="anonymous"
          style={{
            width,
            height,
          }}
        />
      )}
    </AssetLibraryItemButton>
  );
}

interface VideoLibraryProps {
  // The video library to display
  library: VideoLibrary;
  // Function to be called when item is clicked/selected
  onClickLibraryVideo?:
    | ((videoAsset: UploadedVideoAsset | StockVideoAsset | StaticVideoAsset) => void)
    | null;
  // Function to be called when item is clicked/selected
  selectVideoAsset?: ((videoAssetKey: string) => void) | null;
  // The upload key of the currently selected video asset
  selectedVideoAssetKey?: string | null;
  // Array of upload keys for all video assets currently being used in this video
  configurationVideoUploadKeys?: string[];
  // Function to create a video asset in the database
  createVideoAsset?: ((videoProcessingResponse: any) => Promise<void>) | null;
  // Function to set the upload error message
  setUploadErrorMessage?: ((errorMessage: string) => void) | null;
  // Array of video assets currently being uploaded
  uploadingVideoAssets?: UploadingAsset[];
  // Function to set the array of video assets currently being uploaded
  setUploadingVideoAssets?: Dispatch<SetStateAction<UploadingAsset[]>> | null;
  refreshBusinessVideoCountQuery?: any;
  /** The ID of the element that should be used as the drop zone for drag + drop uploads */
  dropZoneTargetId: string;
  // Optional business GUID to track business to upload video assets to
  businessGUID?: string;
}

export function VideoLibrarySection({
  library,
  selectVideoAsset = null,
  onClickLibraryVideo = null,
  selectedVideoAssetKey = null,
  configurationVideoUploadKeys = [],
  createVideoAsset = null,
  setUploadErrorMessage = null,
  uploadingVideoAssets = [],
  setUploadingVideoAssets = null,
  refreshBusinessVideoCountQuery = null,
  dropZoneTargetId,
  businessGUID,
}: VideoLibraryProps) {
  const { videoAssets } = library;

  const [displayAssets, setDisplayAssets] = useState(videoAssets);
  useEffect(() => {
    setDisplayAssets(library.videoAssets);
  }, [library]);

  const [searchBarValue, setSearchBarValue] = useState('');
  const clearSearchBar = () => setSearchBarValue('');

  // The library must have at least one video with a display name set in order to be searchable
  const isLibrarySearchable = useMemo(
    () => Boolean(videoAssets.find(({ displayName }) => Boolean(displayName))),
    [videoAssets],
  );

  /**
   * Upload, process, and create a database record user-selected video files.
   *
   * @param {Array[File]} videoFiles    Video files to upload and process
   */
  const uploadVideoAssets = async (videoFiles: File[]) => {
    const uploadedVideoAssetKeys: string[] = [];

    videoFiles.forEach(async (videoFile) => {
      // Create a placeholder asset to represent upload/processing progress
      const uploadingAsset = new UploadingAsset({ businessGUID });

      setUploadingVideoAssets?.((currentlyUploadingAssets) => [
        uploadingAsset,
        ...currentlyUploadingAssets,
      ]);

      try {
        // Upload and process the video file
        const videoProcessingResponse = (await videoUploadService.uploadVideoAsset(
          videoFile,
          (progress: number) => {
            uploadingAsset.uploadProgress = progress;
            setUploadingVideoAssets?.((currentlyUploadingAssets) => [...currentlyUploadingAssets]);
          },
        )) as any;

        uploadedVideoAssetKeys.push(videoProcessingResponse.uploadKey);

        // Create a record in the DB
        await createVideoAsset?.(videoProcessingResponse);

        // Remove the placeholder asset from the UI
        setUploadingVideoAssets?.((currentlyUploadingAssets) =>
          currentlyUploadingAssets.filter(
            (asset) => asset.placeholderID !== uploadingAsset.placeholderID,
          ),
        );
      } catch (error) {
        console.error(error);
        setUploadErrorMessage?.(
          "We're having trouble uploading your video. Please try again later.",
        );
      }
    });

    // If there was only one successful upload, select it in the video template
    if (uploadedVideoAssetKeys.length === 1 && selectVideoAsset) {
      selectVideoAsset(uploadedVideoAssetKeys.slice(-1)[0]);
    }
  };

  return (
    <div
      className={css`
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        grid-gap: 25px;
        width: 100%;
      `}
    >
      {isLibrarySearchable ? (
        <FuzzySearchBar
          value={searchBarValue}
          onChange={setSearchBarValue}
          clearSearch={clearSearchBar}
          searchItems={videoAssets}
          searchKey="displayName"
          searchThreshold={0.4}
          onUpdateSearch={(filteredDisplayAssets) => {
            // If the returned search results are null, show all assets
            setDisplayAssets(filteredDisplayAssets ?? library.videoAssets);
          }}
          className={css`
            /* Span all columns in the grid row */
            grid-column: 1 / -1;
          `}
        />
      ) : null}

      {library.canUpload ? (
        <EditorFileUploadButton
          onUploadFiles={uploadVideoAssets}
          acceptedFileTypes={['video/mp4', 'video/webm', 'video/quicktime']}
          acceptedFileNames={['.mp4', '.webm', '.mov']}
          maxFileSizeBytes={300000000}
          dropZoneTargetId={dropZoneTargetId}
          maxFileCount={maxSimultaneousUploadCount}
        />
      ) : null}

      {uploadingVideoAssets.map(
        (uploadingAsset) =>
          // We only want to show this if it's unrelated to a specific business or
          // if it's related to the business who's library we're currently viewing
          (!businessGUID || uploadingAsset.businessGUID === businessGUID) && (
            <EditorFileUploadPlaceholder
              key={uploadingAsset.placeholderID}
              uploadProgress={uploadingAsset.uploadProgress}
              uploadProgressLabel={
                // Display a label under the progress bar reflecting what stage of the
                // video upload process we're in
                // The first half of the progress bar represents the initial file upload and the
                // second half represents us processing the file so it's usable in templates
                uploadingAsset.uploadProgress <= 0.5 ? 'Uploading...' : 'Processing...'
              }
            />
          ),
      )}

      {displayAssets.map((videoAsset) => {
        const isInUse = configurationVideoUploadKeys.includes(videoAsset.uploadKey);
        const isSelected = videoAsset.uploadKey === selectedVideoAssetKey;

        return (
          <EditorVideoLibraryItem
            key={videoAsset.uploadKey}
            videoAsset={videoAsset}
            onClickLibraryVideo={onClickLibraryVideo}
            isInUse={isInUse}
            isSelected={isSelected}
            refreshBusinessVideoCountQuery={refreshBusinessVideoCountQuery}
          />
        );
      })}

      {/* If the applied filter has no results, display a message */}

      {isLibrarySearchable && displayAssets.length === 0 ? (
        <div
          className={css`
            /* Span across full grid row */
            grid-column: 1/-1;
          `}
        >
          No results found.
        </div>
      ) : null}
    </div>
  );
}

interface EditorVideoLibrarySectionProps {
  // The video library to display
  library: VideoLibrary;
  // Function to be called when item is clicked/selected
  onClickLibraryVideo?:
    | ((videoAsset: UploadedVideoAsset | StockVideoAsset | StaticVideoAsset) => void)
    | null;
  // Function to be called when item is clicked/selected
  selectVideoAsset?: ((videoAssetKey: string) => void) | null;
  // The upload key of the currently selected video asset
  selectedVideoAssetKey?: string | null;
  // Array of upload keys for all video assets currently being used in this video
  configurationVideoUploadKeys?: string[];
}

export default function EditorVideoLibrarySection({
  library,
  selectVideoAsset = null,
  onClickLibraryVideo = null,
  selectedVideoAssetKey = null,
  configurationVideoUploadKeys = [],
}: EditorVideoLibrarySectionProps) {
  const { displayName, isInitiallyExpanded, shouldDisplaySectionHeader } = library;

  const {
    video: {
      createVideoAsset,
      setUploadErrorMessage,
      uploadingVideoAssets,
      setUploadingVideoAssets,
      refreshBusinessVideoCountQuery,
    },
  } = useEditorMediaLibraries();

  const { editingBusinessGUID } = useEditorBusinessDetailContext();

  if (shouldDisplaySectionHeader) {
    return (
      <EditorCollapsibleLibrarySection
        primaryText={displayName}
        isInitiallyExpanded={isInitiallyExpanded}
      >
        <VideoLibrarySection
          library={library}
          selectVideoAsset={selectVideoAsset}
          onClickLibraryVideo={onClickLibraryVideo}
          selectedVideoAssetKey={selectedVideoAssetKey}
          configurationVideoUploadKeys={configurationVideoUploadKeys}
          createVideoAsset={createVideoAsset}
          setUploadErrorMessage={setUploadErrorMessage}
          uploadingVideoAssets={uploadingVideoAssets}
          setUploadingVideoAssets={setUploadingVideoAssets}
          refreshBusinessVideoCountQuery={refreshBusinessVideoCountQuery}
          dropZoneTargetId="wm-editor-controls"
          businessGUID={editingBusinessGUID}
        />
      </EditorCollapsibleLibrarySection>
    );
  }

  return (
    <VideoLibrarySection
      library={library}
      selectVideoAsset={selectVideoAsset}
      onClickLibraryVideo={onClickLibraryVideo}
      selectedVideoAssetKey={selectedVideoAssetKey}
      configurationVideoUploadKeys={configurationVideoUploadKeys}
      createVideoAsset={createVideoAsset}
      setUploadErrorMessage={setUploadErrorMessage}
      uploadingVideoAssets={uploadingVideoAssets}
      setUploadingVideoAssets={setUploadingVideoAssets}
      refreshBusinessVideoCountQuery={refreshBusinessVideoCountQuery}
      dropZoneTargetId="wm-editor-controls"
      businessGUID={editingBusinessGUID}
    />
  );
}
