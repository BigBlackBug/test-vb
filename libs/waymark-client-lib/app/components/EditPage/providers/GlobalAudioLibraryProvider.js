// Vendor
import {
    createContext,
    useContext,
    useMemo,
    useCallback,
    useState
} from 'react';
import {
    useSelector,
    useDispatch
} from 'react-redux';

// Shared
import sharedPropTypes from 'shared/components/propTypes/index.js';
import {
    fetchGlobalAudioLibraries
} from 'shared/api/index.js';

// Local
import {
    actions
} from 'app/state/ducks/shop/index.js';
import * as selectors from 'app/state/selectors/index.js';

const EditorGlobalAudioLibraryContext = createContext();

export const useGlobalAudioLibraryContext = () => useContext(EditorGlobalAudioLibraryContext);

/**
 * Provides the editor with access global audio libraries.
 */
export default function EditorGlobalAudioLibraryProvider({
    children
}) {
    const globalAudioLibraries = useSelector(selectors.getGlobalAudioLibraries);
    const dispatch = useDispatch();

    const [isFetchingGlobalAudio, setIsFetchingGlobalAudio] = useState(false);

    const loadGlobalAudio = useCallback(async () => {
        setIsFetchingGlobalAudio(true);

        try {
            const fetchedLibraries = await fetchGlobalAudioLibraries();
            dispatch(actions.fetchGlobalAudioLibrariesSuccess(fetchedLibraries));
        } catch (e) {
            console.error(`Error fetching global audio libraries: ${e}`);
        }

        setIsFetchingGlobalAudio(false);
    }, [dispatch]);

    const contextValue = useMemo(
        () => ({
            globalAudioLibraries,
            isFetchingGlobalAudio,
            loadGlobalAudio,
        }), [globalAudioLibraries, isFetchingGlobalAudio, loadGlobalAudio],
    );

    return ( <
        EditorGlobalAudioLibraryContext.Provider value = {
            contextValue
        } > {
            children
        } <
        /EditorGlobalAudioLibraryContext.Provider>
    );
}

EditorGlobalAudioLibraryProvider.propTypes = {
    children: sharedPropTypes.children.isRequired,
};