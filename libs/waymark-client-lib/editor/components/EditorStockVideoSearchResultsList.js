// Vendor
import _ from 'lodash';
import {
    useState,
    useRef,
    useMemo
} from 'react';
import PropTypes from 'prop-types';
import HoverVideoPlayer from 'react-hover-video-player';
import {
    CSSTransition,
    TransitionGroup
} from 'react-transition-group';
import {
    themeVars
} from 'libs/shared-ui-styles';

// WAYMARK APP DEPENDENCIES
import {
    DownloadIcon
} from 'app/icons/PresenceAndSharingIcons';
import {
    CheckMarkIcon
} from 'app/icons/BasicIcons';
import {
    usePrevious
} from 'app/hooks/utils.js';
import {
    useIsWindowMobile
} from 'app/hooks/windowBreakpoint.js';

// Shared
import {
    WaymarkButton
} from 'shared/components/WaymarkButton';
import ProgressiveImage from 'shared/components/ProgressiveImage';
import {
    RotatingLoader
} from '@libs/shared-ui-components';
import {
    whiteColor
} from 'styles/themes/waymark/colors.js';

// Editor
import {
    useStockVideoSearchContext
} from 'editor/providers/EditorStockVideoSearchProvider.js';
import {
    useEditorMediaLibraries
} from 'editor/providers/EditorMediaLibrariesProvider.js';
import EditorFileUploadErrorModal from 'editor/components/EditorFileUploadErrorModal';
import {
    EditorFileUploadError
} from 'editor/utils/editorFileUpload';
import {
    VideoFileUploadLimitExceededError
} from 'editor/constants/customErrors.js';

import {
    Video
} from '@libs/media-asset-management-ts';

import * as styles from './EditorStockVideoSearchResultsList.css';

const ITEM_TRANSITION_STAGGER_DURATION = 50;

/**
 * Displays a video returned by a stock video search which can be added to the user's library
 *
 * @param {object}  props
 * @param {Video}   props.video                 Object representing the video returned from the search
 * @param {bool}    props.isInUserLibrary       Whether this video has already been added to the user's library
 * @param {bool}    props.isUploadingToLibrary  Whether this video is currently being uploaded to the user's library
 * @param {(video: Video)=>void}    props.addVideoToLibrary     Adds this stock video to the user's library
 */
const SearchResultItem = ({
    video,
    isInUserLibrary,
    isUploadingToLibrary,
    addVideoToLibrary
}) => {
    // Keep a ref so we can make the HoverVideoPlayer start when we hover over the outer wrapping div
    // rather than needing to directly mouse over the video
    const gridItemRef = useRef();

    const isMobile = useIsWindowMobile();

    // If we're on mobile we don't want to automatically add the asset on first click.
    const shouldAddVideoOnFirstClick = useRef(!isMobile);

    let overlayContents;

    if (isUploadingToLibrary) {
        overlayContents = ( <
            RotatingLoader strokeWidth = {
                6
            }
            color = {
                themeVars.color.brand.default
            }
            className = {
                styles.RotatingLoaderIcon
            }
            />
        );
    } else if (isInUserLibrary) {
        overlayContents = ( <
            CheckMarkIcon color = {
                themeVars.color.brand.default
            }
            className = {
                styles.InUseCheckMark
            }
            />
        );
    } else {
        overlayContents = ( <
            div className = {
                styles.DownloadIconWrapper
            } >
            <
            DownloadIcon color = {
                whiteColor
            }
            /> <
            /div>
        );
    }

    // Round the asset length to a max of 1 decimal point of precision
    const roundedAssetLength = Math.floor(video.length * 10) / 10;

    // Display the video length and in use tag (when applicable) on top of the hover preview and thumbnail.
    const videoDurationOverlay = < div className = {
        styles.DurationOverlay
    } > {
        roundedAssetLength
    }
    s < /div>;

    /**
     * Manages click events on the hover preview. On desktop the first click should add the stock asset
     * to the user's library, but on mobile the first click should only play the hover preview.
     */
    const onClickSearchResultItem = () => {
        // If the item is currently uploading or it is already in the user's library prevent click events.
        if (isUploadingToLibrary || isInUserLibrary) {
            return;
        }

        if (shouldAddVideoOnFirstClick.current) {
            try {
                addVideoToLibrary(video);
                shouldAddVideoOnFirstClick.current = false;

                return;
            } catch (e) {
                console.error('Could not add asset at this time.');
            }
        }

        // If this value was false (first click on mobile), update it so that the next click will
        // attempt the add the stock asset to the user's library.
        shouldAddVideoOnFirstClick.current = true;
    };

    const aspectRatio = video.width / video.height;

    return ( <
        div ref = {
            gridItemRef
        } >
        <
        WaymarkButton className = {
            styles.GridItem
        }
        style = {
            {
                // Set the top padding so that the item will match the video's native aspect ratio
                // Cap at 80% (4:5 aspect ratio) to prevent tall videos from getting too tall
                paddingTop: `${Math.min(100 / aspectRatio, 80)}%`,
            }
        }
        onClick = {
            onClickSearchResultItem
        }
        hasFill = {
            false
        }
        isUppercase = {
            false
        } >
        <
        div className = {
            styles.GridItemContentsWrapper
        } >
        <
        HoverVideoPlayer videoSrc = {
            video.previewURL
        }
        pausedOverlay = { <
            ProgressiveImage
            src = {
                video.thumbURL
            }
            alt = ""
            shouldCoverContainer
            overlay = {
                videoDurationOverlay
            }
            />
        }
        className = {
            styles.HoverVideoPlayer
        }
        sizingMode = "container"
        hoverTarget = {
            gridItemRef
        }
        unloadVideoOnPaused /
        >
        <
        div className = {
            styles.SearchResultVideoOverlay
        } { ...styles.dataIsUploading(isUploadingToLibrary)
        } { ...styles.dataIsInLibrary(isInUserLibrary)
        } >
        {
            overlayContents
        } <
        /div> <
        /div> <
        /WaymarkButton> <
        /div>
    );
};
SearchResultItem.propTypes = {
    video: PropTypes.shape({
        length: PropTypes.number,
        previewURL: PropTypes.string,
        thumbURL: PropTypes.string,
        width: PropTypes.number,
        height: PropTypes.number,
    }).isRequired,
    isInUserLibrary: PropTypes.bool.isRequired,
    isUploadingToLibrary: PropTypes.bool.isRequired,
    addVideoToLibrary: PropTypes.func.isRequired,
};

/**
 * Displays stock video clips from the current query/category search results
 *
 * @param {function} onAddStockAssetToLibrary    Callback function invoked after stock
 *                                               asset is succesfully added to library
 */
export default function EditorStockVideoSearchResultsList({
    onAddStockAssetToLibrary = null
}) {
    // Keep track of error state to display if anything goes wrong while the user is attempting to
    // add stock videos to their library
    const [uploadErrorMessage, setUploadErrorMessage] = useState(null);
    const [shouldShowErrorModal, setShouldShowErrorModal] = useState(false);

    const {
        videos,
        isLoading,
        hasError,
        searchQuery,
        categoryID,
        nextPageVideoCount,
        getNextPageForSearch,
    } = useStockVideoSearchContext();

    const {
        video: {
            addStockVideoToLibrary,
            getCurrentLibraryStockAssetIDs,
            uploadingStockAssetIds
        },
    } = useEditorMediaLibraries();

    // Grab the source asset IDs for all stock assets to compare to search results
    const userLibraryStockAssetIDs = useMemo(
        () => getCurrentLibraryStockAssetIDs(), [getCurrentLibraryStockAssetIDs],
    );

    /**
     * Takes a stock video object and adds it to the user's library
     *
     * @param {object} video
     */
    const addVideoToLibrary = async (video) => {
        try {
            const stockAssetUploadKey = await addStockVideoToLibrary(video);

            // If no upload key is returned we *should* hit our catch block, but the configurator will blow up
            // if we try to add a video asset to the configuration without a source video.
            if (stockAssetUploadKey) {
                onAddStockAssetToLibrary ? .(stockAssetUploadKey);
            }
        } catch (error) {
            if (error instanceof VideoFileUploadLimitExceededError) {
                setUploadErrorMessage(
                    new EditorFileUploadError(
                        'Too many videos uploading at once',
                        "You're going a little fast for us! Wait a moment and you'll be able to keep adding videos.",
                    ),
                );
            } else {
                // If an error was thrown for any other reason, this is an unexpected error so log it
                console.error(error);

                setUploadErrorMessage(
                    new EditorFileUploadError(
                        'Sorry, something went wrong',
                        "We're having trouble downloading the selected clip right now. Please try again later.",
                    ),
                );
            }

            setShouldShowErrorModal(true);
        }
    };

    // Keep track of the previous number of loaded images so that when the array of videos
    // changes we can tell how many new videos were added and need to be transitioned in
    const previousNumberOfLoadedImages = usePrevious(videos.length);

    return ( <
        div className = {
            styles.ResultsListSection
        } > { /* Show a message that no errors were found if we have successfully completed a search for a query and no videos were returned  */ } {
            !isLoading && !hasError && Boolean(searchQuery || categoryID) && _.isEmpty(videos) ? ( <
                div >
                <
                h3 className = {
                    styles.NoResultsFoundHeading
                } >
                We couldn & #39;t find any images for that search.
          </h3>
          <p className= {
                    styles.NoResultsFoundSubtext
                } >
                Try searching
                for another term, or browse categories. <
                /p> <
                /div>
            ) : ( <
                TransitionGroup className = {
                    styles.SearchResultVideoGrid
                }
                appear > {
                    videos.map((searchResultVideo, index) => {
                        // When a new batch of videos gets loaded in, we want to stagger each one's enter transition by 50ms to create a nice little effect
                        // To determine how much to delay each transition animation, we just need to get the video's position relative to the newly loaded
                        // batch of videos and multiply that by our stagger duration
                        const staggeredTransitionDelay = Math.max(
                            (index - previousNumberOfLoadedImages) * ITEM_TRANSITION_STAGGER_DURATION,
                            0,
                        );

                        // If the matching asset is still uploading or processing, we'll show a loading animation
                        const isUploadingToLibrary = Boolean(
                            uploadingStockAssetIds.find((id) => id === searchResultVideo.sourceAssetID),
                        );

                        // Check if any assets already in the user's library match this one
                        const isInUserLibrary = !isUploadingToLibrary &&
                            Boolean(
                                userLibraryStockAssetIDs.find((id) => id === searchResultVideo.sourceAssetID),
                            );

                        return ( <
                            CSSTransition key = {
                                searchResultVideo.sourceAssetID
                            }
                            mountOnEnter unmountOnExit timeout = {
                                // The total transition should last as long as its base transition duration, plus
                                // however long the transition needs to be delayed first
                                styles.ITEM_TRANSITION_DURATION + staggeredTransitionDelay
                            }
                            classNames = {
                                {
                                    appear: styles.SearchResultItemEnterStart,
                                    appearActive: styles.SearchResultItemEnterEnd,
                                    enter: styles.SearchResultItemEnterStart,
                                    enterActive: styles.SearchResultItemEnterEnd,
                                }
                            } >
                            <
                            div style = {
                                {
                                    transitionDelay: `${staggeredTransitionDelay}ms`,
                                }
                            } >
                            <
                            SearchResultItem video = {
                                searchResultVideo
                            }
                            isInUserLibrary = {
                                isInUserLibrary
                            }
                            isUploadingToLibrary = {
                                isUploadingToLibrary
                            }
                            addVideoToLibrary = {
                                addVideoToLibrary
                            }
                            /> <
                            /div> <
                            /CSSTransition>
                        );
                    })
                } <
                /TransitionGroup>
            )
        } {
            nextPageVideoCount ? ( <
                WaymarkButton hasFill = {
                    false
                }
                className = {
                    styles.LoadMoreButton
                }
                colorTheme = "BlackText"
                onClick = {
                    getNextPageForSearch
                }
                isLoading = {
                    isLoading
                }
                isSmall >
                Load more clips <
                /WaymarkButton>
            ) : null
        } <
        EditorFileUploadErrorModal title = {
            uploadErrorMessage ? uploadErrorMessage.heading : ''
        }
        errorMessage = {
            uploadErrorMessage ? uploadErrorMessage.body : ''
        }
        isVisible = {
            shouldShowErrorModal
        }
        onCloseModal = {
            () => setShouldShowErrorModal(false)
        }
        /> <
        /div>
    );
}
EditorStockVideoSearchResultsList.propTypes = {
    onAddStockAssetToLibrary: PropTypes.func,
};