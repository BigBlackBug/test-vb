// Vendor
import {
    createContext,
    useContext,
    useState
} from 'react';

// Shared
import sharedPropTypes from 'shared/components/propTypes/index.js';

// App
import {
    useBusinessDetailsByBusinessGUID,
    useAllBusinessesForAccount,
} from 'shared/api/graphql/businesses/queries';

const EditorBusinessDetailContext = createContext();

export const useEditorBusinessDetailContext = () => useContext(EditorBusinessDetailContext);

/**
 * Responsible for managing the business requested by the Editor.
 * Provides details for the requested business and the GUID to asset loading providers to ensure consistency throughout Editor panels.
 */
export default function EditorBusinessDetailProvider({
    children
}) {
    const [appliedBusinessGUID, setAppliedBusinessGUID] = useState(null);
    const [editingBusinessGUID, setEditingBusinessGUID] = useState(null);

    const {
        businessDetails: appliedBusinessDetails,
        isLoading: isAppliedBusinessLoading,
        refetch: refetchAppliedBusinessDetails,
    } = useBusinessDetailsByBusinessGUID(appliedBusinessGUID);

    const {
        businessDetails: editingBusinessDetails,
        isLoading: isEditingBusinessLoading,
        refetch: refetchEditingBusinessDetails,
    } = useBusinessDetailsByBusinessGUID(editingBusinessGUID);

    const {
        businesses: allBusinessesForAccount,
        isLoading: isLoadingAllBusinesses,
        refetchBusinessesForAccount,
    } = useAllBusinessesForAccount();

    const contextValue = {
        // applied business
        appliedBusinessGUID,
        setAppliedBusinessGUID,
        appliedBusinessDetails,
        isAppliedBusinessLoading,
        refetchAppliedBusinessDetails,
        // editing business
        editingBusinessGUID,
        setEditingBusinessGUID,
        editingBusinessDetails,
        isEditingBusinessLoading,
        refetchEditingBusinessDetails,
        // account businesses
        allBusinessesForAccount,
        isLoadingAllBusinesses,
        refetchBusinessesForAccount,
    };

    return ( <
        EditorBusinessDetailContext.Provider value = {
            contextValue
        } > {
            children
        } <
        /EditorBusinessDetailContext.Provider>
    );
}
EditorBusinessDetailProvider.propTypes = {
    children: sharedPropTypes.children.isRequired,
};