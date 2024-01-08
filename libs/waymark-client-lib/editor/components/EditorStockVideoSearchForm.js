// Vendor
import {
    useEffect,
    useState
} from 'react';
import PropTypes from 'prop-types';
import {
    css
} from '@emotion/css';

// Shared
import WaymarkTextInput from 'shared/components/WaymarkTextInput';
import {
    WaymarkButton
} from 'shared/components/WaymarkButton';

// Editor
import {
    useStockVideoSearchContext
} from 'editor/providers/EditorStockVideoSearchProvider.js';

// WAYMARK APP DEPENDENCIES
import ToggleCollapseTransition from 'app/components/ToggleCollapseTransition';

import {
    errorColor
} from 'styles/themes/waymark/colors.js';
import {
    useTypography
} from 'styles/hooks/typography.js';

/**
 * Renders a form with a search bar which allows the user to submit a search query to the
 * stock video API
 *
 * @param {func}  scrollEditorPanelToTop    Scrolls the editor control panel to the top so we can help keep content jumps under control
 *                                            when the user submits a new search
 */
export default function EditorStockVideoSearchForm({
    scrollEditorPanelToTop
}) {
    const {
        isLoading,
        hasError,
        searchQuery,
        searchByQueryString
    } = useStockVideoSearchContext();

    // Keep track of the current value in the search bar so we can submit it for search queries
    const [searchInputValue, setSearchInputValue] = useState(searchQuery || '');

    const onSubmitSearchForm = (event) => {
        // Prevent default so the form doesn't post and refresh the page
        event.preventDefault();

        // Ensure the editor panel is scrolled up as we start a new search to try to avoid content jumps
        scrollEditorPanelToTop();

        searchByQueryString(searchInputValue);
    };

    useEffect(() => {
        if (!searchQuery) {
            // If the search query is cleared, clear the search bar's contents
            setSearchInputValue('');
        }
    }, [searchQuery]);

    const [bodySmallTextStyle] = useTypography(['bodySmall']);

    return ( <
        >
        <
        form onSubmit = {
            onSubmitSearchForm
        }
        className = {
            css `
          display: flex;
          margin-bottom: 4px;
        `
        } >
        <
        WaymarkTextInput className = {
            css `
            flex-grow: 1;
          `
        }
        value = {
            searchInputValue
        }
        onChange = {
            (event) => setSearchInputValue(event.target.value)
        }
        /> <
        WaymarkButton type = "submit"
        colorTheme = {
            hasError ? 'Negative' : 'Primary'
        }
        className = {
            css `
            padding: 4px 8px !important;
            margin-left: 6px;
          `
        }
        isSmall isLoading = {
            isLoading
        }
        // Disable the search button if there's nothing in the search bar
        isDisabled = {!searchInputValue
        } >
        Search <
        /WaymarkButton> <
        /form> <
        ToggleCollapseTransition isVisible = {
            hasError
        }
        duration = {
            150
        }
        className = {
            css `
          ${bodySmallTextStyle}
          color: ${errorColor};
          padding-bottom: 8px;
        `
        } >
        Something went wrong with your search.Please
        try again or
        try different search terms. <
        /ToggleCollapseTransition> <
        />
    );
}
EditorStockVideoSearchForm.propTypes = {
    scrollEditorPanelToTop: PropTypes.func.isRequired,
};