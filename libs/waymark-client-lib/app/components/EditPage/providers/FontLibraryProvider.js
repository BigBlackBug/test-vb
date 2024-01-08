// Vendor
import {
    createContext,
    useContext,
    useState
} from 'react';
import {
    useSelector
} from 'react-redux';

// Shared
import sharedPropTypes from 'shared/components/propTypes/index.js';

// App
import {
    useFontLibrariesForBusiness,
    useGlobalFontLibraries,
    useFontLibrariesForAccount,
} from 'app/models/fontLibraries/hooks';
import * as selectors from 'app/state/selectors/index.js';
import {
    useEditorBusinessDetailContext
} from './BusinessDetailProvider.js';

export const EditorFontLibraryContext = createContext();

export const useEditorFontLibraryContext = () => useContext(EditorFontLibraryContext);

/**
 * Responsible for providing the Editor with the ability to load font libraries
 * and access their values.
 *
 * @param {children}  children     Children with access to provider.
 */
const EditorFontLibraryProvider = ({
    children
}) => {
    const [shouldLoadFontLibraries, setShouldLoadFontLibraries] = useState(false);

    // Get global font libraries that are available to all users
    const {
        globalFontLibraries,
        isLoading: areGlobalFontLibrariesLoading
    } = useGlobalFontLibraries(!shouldLoadFontLibraries, );

    // Get font library data for the business that's currently selected
    const {
        appliedBusinessGUID,
        editingBusinessGUID
    } = useEditorBusinessDetailContext();

    const {
        businessFontLibraries: appliedBusinessFontLibraries,
        isLoading: areAppliedBusinessFontLibrariesLoading,
    } = useFontLibrariesForBusiness(shouldLoadFontLibraries ? appliedBusinessGUID : null);
    const {
        businessFontLibraries: editingBusinessFontLibraries,
        isLoading: areEditingBusinessFontLibrariesLoading,
    } = useFontLibrariesForBusiness(shouldLoadFontLibraries ? editingBusinessGUID : null);

    // Load font library data for the current account
    const accountGUID = useSelector(selectors.getAccountGUID);
    const {
        accountFontLibraries,
        accountGroupFontLibraries,
        isLoading: areAccountFontLibrariesLoading,
    } = useFontLibrariesForAccount(shouldLoadFontLibraries ? accountGUID : null);

    // Indicate that fonts are loading if any font library query is currently in progress
    const isLoadingFonts =
        areGlobalFontLibrariesLoading ||
        areAppliedBusinessFontLibrariesLoading ||
        areEditingBusinessFontLibrariesLoading ||
        areAccountFontLibrariesLoading;

    return ( <
        EditorFontLibraryContext.Provider
        // eslint-disable-next-line react/jsx-no-constructed-context-values
        value = {
            {
                accountFontLibraries,
                accountGroupFontLibraries,
                appliedBusinessFontLibraries,
                editingBusinessFontLibraries,
                globalFontLibraries,
                setShouldLoadFontLibraries,
                isLoadingFonts,
            }
        } >
        {
            children
        } <
        /EditorFontLibraryContext.Provider>
    );
};

EditorFontLibraryProvider.propTypes = {
    children: sharedPropTypes.children.isRequired,
};

export default EditorFontLibraryProvider;