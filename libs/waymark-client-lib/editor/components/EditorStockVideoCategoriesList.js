// Vendor
import PropTypes from 'prop-types';

// Shared
import {
    WaymarkButton
} from 'shared/components/WaymarkButton';
import ProgressiveImage from 'shared/components/ProgressiveImage';

// Editor
import {
    useStockVideoSearchContext
} from 'editor/providers/EditorStockVideoSearchProvider.js';

// App
import {
    shutterstockCategories
} from 'app/constants/ShutterstockCategories';

import * as styles from './EditorStockVideoCategoriesList.css';

/**
 * Displays a grid of shutterstock category buttons which can be selected to view stock videos from
 * the category
 *
 * @param {func}  scrollEditorPanelToTop    Scrolls the control panel to the top when a category is selected to help prevent a content jump
 */
export default function EditorStockVideoCategoriesList({
    scrollEditorPanelToTop
}) {
    const {
        selectCategory
    } = useStockVideoSearchContext();

    return ( <
        div className = {
            styles.CategoriesList
        } > {
            shutterstockCategories.map(({
                videoCategoryID,
                displayName,
                thumbnailURL
            }) => ( <
                WaymarkButton key = {
                    videoCategoryID
                }
                onClick = {
                    () => {
                        scrollEditorPanelToTop();
                        selectCategory(videoCategoryID);
                    }
                }
                className = {
                    styles.CategoryButton
                }
                isUppercase = {
                    false
                } >
                {
                    thumbnailURL && < ProgressiveImage src = {
                        thumbnailURL
                    }
                    shouldCoverContainer alt = "" / >
                } <
                div className = {
                    styles.CategoryName
                } > {
                    displayName
                } < /div> <
                /WaymarkButton>
            ))
        } <
        /div>
    );
}
EditorStockVideoCategoriesList.propTypes = {
    scrollEditorPanelToTop: PropTypes.func.isRequired,
};