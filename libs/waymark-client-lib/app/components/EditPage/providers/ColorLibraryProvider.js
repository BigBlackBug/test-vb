// Vendor
import {
    createContext,
    useContext,
    useMemo,
    useState
} from 'react';
import {
    useSelector
} from 'react-redux';

// Local
import * as selectors from 'app/state/selectors/index.js';
import sharedPropTypes from 'shared/components/propTypes/index.js';
import {
    useColorLibrariesForAccount,
    useColorLibrariesForBusiness,
} from 'app/models/colorLibraries/hooks';
import {
    useEditorBusinessDetailContext
} from './BusinessDetailProvider.js';

export const EditorColorLibraryContext = createContext();

export const useEditorColorLibraryContext = () => useContext(EditorColorLibraryContext);

/**
 * Responsible for providing the Editor with the ability to
 * - load color libraries
 * - access their values
 * - access custom account colors
 * - create and remove custom account colors
 *
 * @param {children}  children     Children with access to provider.
 */
const EditorColorLibraryProvider = ({
    children
}) => {
    const [shouldLoadColorLibraries, setShouldLoadColorLibraries] = useState(false);

    // Get color library data for the account and their account group
    const accountGUID = useSelector(selectors.getAccountGUID);
    const {
        accountColorLibraries,
        accountGroupColorLibraries
    } = useColorLibrariesForAccount(
        shouldLoadColorLibraries ? accountGUID : null,
    );

    // Load color library data for the selected business
    const [shouldLoadBusinesColorLibraries, setShouldLoadBusinesColorLibraries] = useState(false);

    const {
        appliedBusinessGUID,
        editingBusinessGUID
    } = useEditorBusinessDetailContext();

    const {
        businessColorLibraries: appliedBusinessColorLibraries
    } = useColorLibrariesForBusiness(
        shouldLoadColorLibraries || shouldLoadBusinesColorLibraries ? appliedBusinessGUID : null,
    );
    const {
        businessColorLibraries: editingBusinessColorLibraries
    } = useColorLibrariesForBusiness(
        shouldLoadColorLibraries || shouldLoadBusinesColorLibraries ? editingBusinessGUID : null,
    );

    const contextValue = useMemo(
        () => ({
            accountColorLibraries,
            accountGroupColorLibraries,
            appliedBusinessColorLibraries,
            editingBusinessColorLibraries,
            setShouldLoadColorLibraries,
            setShouldLoadBusinesColorLibraries,
        }), [
            accountColorLibraries,
            accountGroupColorLibraries,
            appliedBusinessColorLibraries,
            editingBusinessColorLibraries,
        ],
    );

    return ( <
        EditorColorLibraryContext.Provider value = {
            contextValue
        } > {
            children
        } <
        /EditorColorLibraryContext.Provider>
    );
};

EditorColorLibraryProvider.propTypes = {
    children: sharedPropTypes.children.isRequired,
};

export default EditorColorLibraryProvider;