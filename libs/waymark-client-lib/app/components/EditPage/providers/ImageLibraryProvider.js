// Vendor
import {
    useContext,
    useState,
    useCallback,
    createContext
} from 'react';
import {
    useSelector
} from 'react-redux';

// Shared
import sharedPropTypes from 'shared/components/propTypes/index.js';

// Local
import * as selectors from 'app/state/selectors/index.js';
import {
    useAccountAndAccountGroupImageLibraries,
    useBusinessImageLibraries,
} from 'app/models/imageLibraries/hooks';

import {
    useEditorBusinessDetailContext
} from './BusinessDetailProvider.js';

const EditorImageLibraryContext = createContext();

export const useEditorImageLibraryContext = () => useContext(EditorImageLibraryContext);

/**
 * Constructs and provides access to the sections to render in the editor's template images library
 *
 * NOTE: It is currently possible for additional images to be visible
 * via the shop.editorImageLibrarySlugs selector. editorImageLibrarySlugs creates image libraries,
 * like accountGroupImageLibraries, but bypasses account verification.
 *
 * @param {children}  children    Children that the provider is wrapping
 */
const EditorImageLibraryProvider = ({
    children
}) => {
    const accountGUID = useSelector(selectors.getAccountGUID);

    // Account
    const [shouldFetchAccountAssets, setShouldFetchAccountAssets] = useState(false);

    const {
        accountImageLibraries,
        accountGroupImageLibraries,
        isLoading: areAccountImageLibrariesLoading,
    } = useAccountAndAccountGroupImageLibraries(shouldFetchAccountAssets ? accountGUID : null);

    // Businesses
    const {
        appliedBusinessGUID,
        editingBusinessGUID
    } = useEditorBusinessDetailContext();

    // Display assets for different businesses depending on which panel is open
    const [shouldFetchBusinessAssets, setShouldFetchBusinessAssets] = useState(false);

    const {
        businessImageLibraries: appliedBusinessImageLibraries,
        isLoading: areAppliedBusinessImageLibrariesLoading,
    } = useBusinessImageLibraries(shouldFetchBusinessAssets ? appliedBusinessGUID : null);

    const {
        businessImageLibraries: editingBusinessImageLibraries,
        isLoading: areEditingBusinessImageLibrariesLoading,
    } = useBusinessImageLibraries(shouldFetchBusinessAssets ? editingBusinessGUID : null);

    // Panel setup methods
    /**
     * Panel setup method for the TemplateImagesLibraryPanel
     * - Load account and selected business images libraries
     */
    const onOpenTemplateImagesPanel = useCallback(() => {
        setShouldFetchAccountAssets(true);
        setShouldFetchBusinessAssets(true);
    }, []);

    /**
     * Panel setup method for the BusinessProfileImagesPanel
     * - Load images for the current business profile
     */
    const onOpenBusinessProfileImagesPanel = useCallback(() => {
        // Load images for the selected business profile
        setShouldFetchBusinessAssets(true);
    }, []);

    /**
     * Panel setup method for TemplateImagesEditPanel
     *
     * Find the current image field's corresponding image asset and library. If the image field contains a stock
     * asset or an original template image, no asset and library will be returned.
     */
    const onOpenTemplateImageEditPanel = useCallback(
        (currentlyEditingImageURL) => {
            const accountImageLibrary = accountImageLibraries ? .[0];
            const appliedBusinessLibrary = appliedBusinessImageLibraries ? .[0];

            let foundImageAsset = null;

            if (accountImageLibrary) {
                foundImageAsset = accountImageLibrary.getImageAssetForURL(currentlyEditingImageURL);
                if (foundImageAsset) {
                    return {
                        asset: foundImageAsset,
                        library: accountImageLibrary,
                    };
                }
            }

            if (!foundImageAsset && appliedBusinessLibrary) {
                foundImageAsset = appliedBusinessLibrary.getImageAssetForURL(currentlyEditingImageURL);
                if (foundImageAsset) {
                    return {
                        asset: foundImageAsset,
                        library: appliedBusinessLibrary,
                    };
                }
            }

            return null;
        }, [accountImageLibraries, appliedBusinessImageLibraries],
    );

    return ( <
        EditorImageLibraryContext.Provider value = {
            {
                accountImageLibraries,
                areAccountImageLibrariesLoading,
                editingBusinessImageLibraries,
                appliedBusinessImageLibraries,
                areBusinessImagesLoading: areAppliedBusinessImageLibrariesLoading || areEditingBusinessImageLibrariesLoading,
                // The Editor doesn't really care about account groups (I know, way harsh).
                // It just needs to know that these images cannot be added or removed from
                // these libraries during a session by a regular user.
                staticImageLibraries: accountGroupImageLibraries,
                // Panel setup methods
                onOpenTemplateImagesPanel,
                onOpenBusinessProfileImagesPanel,
                onOpenTemplateImageEditPanel,
            }
        } >
        {
            children
        } <
        /EditorImageLibraryContext.Provider>
    );
};

EditorImageLibraryProvider.propTypes = {
    children: sharedPropTypes.children.isRequired,
};

export default EditorImageLibraryProvider;