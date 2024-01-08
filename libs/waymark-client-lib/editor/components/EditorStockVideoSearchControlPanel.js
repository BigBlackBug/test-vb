// Vendor
import {
    useState
} from 'react';
import PropTypes from 'prop-types';
import {
    css
} from '@emotion/css';

// Editor
import {
    EditorControlPanelHeading
} from 'editor/components/EditorControlHeadings';
import HeaderButtonRow from 'editor/components/EditorControlPanelHeaderButtonRow.js';
import BaseHeaderBackButton from 'editor/components/BaseHeaderBackButton';
import EditorStockVideoSearchProvider, {
    useStockVideoSearchContext,
} from 'editor/providers/EditorStockVideoSearchProvider.js';
import EditorFileUploadErrorModal from 'editor/components/EditorFileUploadErrorModal';
import EditorStockVideoSearchForm from 'editor/components/EditorStockVideoSearchForm.js';
import EditorStockVideoSearchResultsList from 'editor/components/EditorStockVideoSearchResultsList.js';
import EditorStockVideoCategoriesList from 'editor/components/EditorStockVideoCategoriesList.js';
import {
    useEditorMediaLibraries
} from 'editor/providers/EditorMediaLibrariesProvider.js';
import makeEditorControlPanel from 'editor/components/panels/utils/makeEditorControlPanel';

// Shared
import ErrorBoundary from 'shared/components/ErrorBoundary';
import {
    WaymarkButton
} from 'shared/components/WaymarkButton';
import FadeSwitchTransition from 'shared/components/FadeSwitchTransition';

/* WAYMARK APP DEPENDENCIES */
import {
    ShutterstockTermsModal
} from 'app/components/ShutterstockTermsModal';
/* END WAYMARK APP DEPENDENCIES */

import * as styles from './EditorStockVideoSearchControlPanel.css';

/**
 * Header buttons at top of the stock videos panel to close the panel and clear the current search to
 * return to the video categories list
 */
const EditorStockVideoSearchHeader = () => {
    const {
        searchQuery,
        categoryID,
        clearSearch
    } = useStockVideoSearchContext();

    // Should show button to clear search if we have active search params and are not currently in a loading state
    const shouldDisplayClearSearchButton = Boolean(searchQuery || categoryID);

    return ( <
        HeaderButtonRow > { /* Back button clears the current seach terms and returns to the main video control panel */ } <
        BaseHeaderBackButton onClick = {
            clearSearch
        }
        /> {
            shouldDisplayClearSearchButton && ( <
                WaymarkButton colorTheme = "BlackText"
                onClick = {
                    clearSearch
                }
                hasFill = {
                    false
                }
                isSmall >
                Categories <
                /WaymarkButton>
            )
        } <
        /HeaderButtonRow>
    );
};

/**
 * Provides interface for users to search for stock videos and add them to their library
 */
const EditorStockVideoSearchControlPanel = ({
    scrollEditorPanelToTop,
    sharedPanelContext
}) => {
    const [shouldShowShutterstockTermsModal, setShouldShowShutterstockTermsModal] = useState(false);

    const {
        searchQuery,
        categoryID
    } = useStockVideoSearchContext();

    const {
        onAddStockAssetToLibrary
    } = sharedPanelContext;

    const {
        video: {
            setUploadErrorMessage,
            uploadErrorMessage
        },
    } = useEditorMediaLibraries();

    // Should show search results if we have active search params
    const shouldDisplaySearchResults = Boolean(searchQuery || categoryID);

    return ( <
        ErrorBoundary containerClass = {
            styles.ErrorBoundaryContainer
        } >
        <
        EditorControlPanelHeading heading = "Search stock clips"
        subheading = { <
            >
            <
            b > Type in a word to search
            for videos on Shutterstock. < /b> Read the{' '} <
            WaymarkButton
            onClick = {
                () => setShouldShowShutterstockTermsModal(true)
            }
            hasFill = {
                false
            }
            isUppercase = {
                false
            }
            colorTheme = "PrimaryText"
            typography = "inherit"
            className = {
                css `
                &:hover {
                  text-decoration: underline;
                }
              `
            } >
            Terms of Use <
            /WaymarkButton>{' '}
            before getting started. <
            />
        }
        /> <
        ShutterstockTermsModal isVisible = {
            shouldShowShutterstockTermsModal
        }
        onCloseModal = {
            () => setShouldShowShutterstockTermsModal(false)
        }
        modalSize = "large"
        cancelInterface = "button"
        cancelButtonText = "Okay" /
        >
        <
        EditorStockVideoSearchForm scrollEditorPanelToTop = {
            scrollEditorPanelToTop
        }
        /> <
        FadeSwitchTransition transitionKey = {
            shouldDisplaySearchResults ? 'search_results' : 'categories'
        } >
        {
            shouldDisplaySearchResults ? ( <
                EditorStockVideoSearchResultsList onAddStockAssetToLibrary = {
                    onAddStockAssetToLibrary
                }
                />
            ) : ( <
                EditorStockVideoCategoriesList scrollEditorPanelToTop = {
                    scrollEditorPanelToTop
                }
                />
            )
        } <
        /FadeSwitchTransition> <
        EditorFileUploadErrorModal title = "Sorry!"
        errorMessage = {
            uploadErrorMessage
        }
        isVisible = {
            Boolean(uploadErrorMessage)
        }
        onCloseModal = {
            () => setUploadErrorMessage('')
        }
        /> <
        /ErrorBoundary>
    );
};
EditorStockVideoSearchControlPanel.propTypes = {
    scrollEditorPanelToTop: PropTypes.func.isRequired,
    sharedPanelContext: PropTypes.object.isRequired,
};

/**
 * Constructing and exporting an object that can be consumed by the EditorControlPanel component to render the appropriate
 * components for this editor control panel
 *
 * The output format is an object with the structure:
 * {
 *   Header: HeaderComponent,
 *   Controls: ControlsComponent,
 *   Provider: ProviderComponent (optional)
 * }
 */
export default makeEditorControlPanel(
    EditorStockVideoSearchHeader,
    EditorStockVideoSearchControlPanel,
    EditorStockVideoSearchProvider,
);