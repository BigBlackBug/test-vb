// Vendor
import {
    useRef,
    useEffect,
    useState,
    useCallback
} from 'react';
import {
    useHistory
} from 'react-router-dom';

// Editor
import {
    useEditorState,
    SAVE_DRAFT_STATES
} from 'editor/providers/EditorStateProvider.js';
import {
    useEditorVideoContext
} from 'editor/providers/EditorVideoProvider.js';
import editorEventEmitter from 'editor/utils/editorEventEmitter.js';
import EditorUnsavedChangesModal from 'editor/components/EditorUnsavedChangesModal';

// Regex will match url paths for editing user videos
const editUserVideoURLRegex =
    /your-videos\/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[0-9a-f]{4}-[0-9a-f]{12}\/edit/;

const CONFIRMATION_MESSAGE = 'Your video has unsaved edits. Are you sure you want to leave?';

/**
 * Blocks navigation if the user attempts to close the editor when they still have unsaved changes
 */
export default function EditorUnsavedChangesBlocker() {
    const [shouldShowUnsavedChangesModal, setShouldShowUnsavedChangesModal] = useState();

    const {
        isEditableTemplate
    } = useEditorVideoContext();
    const {
        saveDraftState
    } = useEditorState();

    // Keep track of whether we have any unsaved changes in a ref so that we don't have to re-run effects every time the save state changes
    const shouldBlockNavigationRef = useRef();
    shouldBlockNavigationRef.current =
        isEditableTemplate && saveDraftState !== SAVE_DRAFT_STATES.saved;

    const {
        block,
        location: currentLocation
    } = useHistory();

    // Keep track of the previous history location in a ref so that we can immediately
    // check against it when history.block gets triggered
    const previousLocationPathnameRef = useRef();
    previousLocationPathnameRef.current = currentLocation.pathname;

    // Hook up event listener for blocking when the user tries to fully unload the page (ie, closing the tab, refreshing)
    useEffect(() => {
        // Listen to `beforeunload` event to block navigating away from the page if the user has unsaved changes
        const onBeforeUnload = (event) => {
            // If the user has unsaved changes, stop them from navigating and show a warning
            // Implementations of how to do this vary across different browsers so we're going to hit them all:
            if (shouldBlockNavigationRef.current) {
                // The "official" way to block navigation is to call `preventDefault` on the event
                event.preventDefault();

                // Some browsers check if the event object's `returnValue` has been set to a string;
                // this string should then be used for the popup's message, but most browsers ignore that
                // and show their own generic prompt for security reasons
                // eslint-disable-next-line no-param-reassign
                event.returnValue = CONFIRMATION_MESSAGE;

                // Some browsers allegedly also may check if the `beforeunload` event callback returned a string
                // and use that string in a similar fashion to how `event.returnValue` was described above.
                return CONFIRMATION_MESSAGE;
            }

            return null;
        };

        window.addEventListener('beforeunload', onBeforeUnload);

        return () => window.removeEventListener('beforeunload', onBeforeUnload);
    }, []);

    useEffect(() => {
        // Emit an `editorExited` editor event if the page unloads. This will be triggered
        // if the user fully continues past the `onBeforeUnload` prompt above,
        // either because their changes were saved or they proceed past the unsaved changes prompt.
        const onUnload = () => editorEventEmitter.emit('editorExited');

        window.addEventListener('unload', onUnload);

        return () => window.removeEventListener('unload', onUnload);
    }, []);

    // Block the user from navigating out of the editor if they have unsaved changes
    useEffect(() => {
        // Navigating to a different page within a single-page app will not fire the `beforeunload`
        // event, so we need to also add a block for react router's history
        const unblockRouterNavigation = block((newLocation) => {
            // If the new location matches regex for editing a user video, this means the url was changed because
            //  we just saved the video for the first time and therefore aren't really closing the editor
            // In this case, just return true without doing anything else to allow the navigation to proceed
            if (editUserVideoURLRegex.test(newLocation.pathname)) {
                return true;
            }

            if (previousLocationPathnameRef.current !== newLocation.pathname) {
                // If we're navigating to a different page and have unsaved changes, open the unsaved changes modal
                if (shouldBlockNavigationRef.current) {
                    setShouldShowUnsavedChangesModal(true);
                    // Return false to indicate the attempted navigation should be cancelled
                    return false;
                }
            }

            // Emit an event indicating the editor is being closed
            editorEventEmitter.emit('editorExited');
            return true;
        });

        return () => unblockRouterNavigation();
    }, [block]);

    const onClickDiscardChanges = useCallback(() => {
        // Mark that we don't care about preserving the unsaved changes and proceed to close the editor
        shouldBlockNavigationRef.current = false;
        editorEventEmitter.emit('closeEditor');
        setShouldShowUnsavedChangesModal(false);
    }, []);

    // Listen for `attemptCloseEditor` events which will be fired when the user clicks the editor's "Exit" button
    useEffect(() => {
        const onAttemptCloseEditor = () => {
            if (shouldBlockNavigationRef.current) {
                // If we have unsaved changes, show the unsaved changes modal
                setShouldShowUnsavedChangesModal(true);
            } else {
                // There aren't any unsaved changes to preserve so just close the editor
                onClickDiscardChanges();
            }
        };

        editorEventEmitter.on('attemptCloseEditor', onAttemptCloseEditor);

        return () => editorEventEmitter.off('attemptCloseEditor', onAttemptCloseEditor);
    }, [onClickDiscardChanges]);

    // Render a modal which will open if the user attempts to close the editor with the "Exit" button
    return ( <
        EditorUnsavedChangesModal title = "Finalize Video"
        warningMessage = {
            CONFIRMATION_MESSAGE
        }
        confirmButtonText = "Confirm"
        isVisible = {
            shouldShowUnsavedChangesModal
        }
        onCloseModal = {
            () => setShouldShowUnsavedChangesModal(false)
        }
        onClickDiscardChanges = {
            onClickDiscardChanges
        }
        cancelInterface = "text"
        cancelButtonText = "Cancel" /
        >
    );
}