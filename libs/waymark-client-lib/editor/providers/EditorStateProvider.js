// Vendor
import _ from 'lodash';
import {
    createContext,
    useContext,
    useCallback,
    useMemo,
    useEffect,
    useState,
    useRef,
} from 'react';
import PropTypes from 'prop-types';

// Editor
import {
    useEditorVideoAssetLibraryContext
} from 'app/components/EditPage/providers/VideoAssetLibraryProvider.js';
import {
    useEditorVideoContext
} from 'editor/providers/EditorVideoProvider.js';
import editorEventEmitter from 'editor/utils/editorEventEmitter.js';

// Shared
import sharedPropTypes from 'shared/components/propTypes/index.js';

import {
    VideoDescriptor,
    VideoConfiguration
} from '@libs/shared-types';

// WAYMARK APP DEPENDENCIES
import {
    CoreBusinessDetails,
    coreBusinessDetailsPropType,
} from 'shared/api/graphql/businesses/fragments';
import useEvent from 'shared/hooks/useEvent';
import {
    getWaymarkSDKStore
} from 'app/state/sdkStore/sdkStore';

/**
 * @typedef {Object} EditorStateContextValue
 *
 * @property {VideoDescriptor} videoDescriptor
 * @property {VideoConfiguration} configuration
 * @property {VideoConfiguration} defaultConfiguration
 *
 * @property {string} videoTitle
 * @property {string} saveDraftState
 * @property {string} accountName
 * @property {string} appliedBusinessGUID
 *
 * @property {CoreBusinessDetails[]} allBusinessesForAccount
 * @property {boolean} isLoadingAllBusinesses
 * @property {string} editingBusinessGUID
 * @property {CoreBusinessDetails} editingBusinessDetails
 * @property {boolean} isEditingBusinessLoading
 * @property {CoreBusinessDetails} appliedBusinessDetails
 * @property {boolean} isAppliedBusinessLoading
 *
 * @property {string} appliedAIVoiceOverSpeakerGUID
 * @property {string} appliedAIVoiceOverText
 */

export const EditorStateContext = createContext();
/** @returns {EditorStateContextValue} */
export const useEditorState = () => useContext(EditorStateContext);

export const EditorDispatchContext = createContext();
export const useEditorDispatch = () => useContext(EditorDispatchContext);

export const SAVE_DRAFT_STATES = {
    unsaved: 'unsaved',
    savePending: 'savePending',
    saved: 'saved',
    failed: 'failed',
};

/**
 * EditorStateProvider manages formatting and modifying the video's configuration and title
 * for use throughout the entire editor
 *
 * @param {function}  createOrUpdateSavedDraft - Creates a SavedDraft and UserVideo record for the video if one doesn't exist,
 *                                                  or else just updates the existing records for the video
 * @param {function}  openUserVideoInEditor - Navigates to open a given user video in the editor
 * @param {bool}      isUserLoggedIn - Whether the user is currently logged into an account and we can therefore auto-save their video
 */
export default function EditorStateProvider({
    createOrUpdateSavedDraft,
    openUserVideoInEditor,
    isUserLoggedIn,
    accountName = '',
    allBusinessesForAccount,
    isLoadingAllBusinesses,
    refetchBusinessesForAccount,
    appliedBusinessGUID = null,
    setAppliedBusinessGUID,
    appliedBusinessDetails = null,
    isAppliedBusinessLoading,
    editingBusinessGUID = null,
    setEditingBusinessGUID,
    editingBusinessDetails = null,
    isEditingBusinessLoading,
    children,
}) {
    const {
        editorVariant,
        editorUserVideo
    } = useEditorVideoContext();

    const {
        getInUseStockVideoAssetKeys
    } = useEditorVideoAssetLibraryContext();

    const [videoDescriptor, setVideoDescriptor] = useState(() => {
        return _.cloneDeep(
            editorUserVideo ? editorUserVideo.videoDescriptor : editorVariant.videoDescriptor,
        );
    });

    const configuration = videoDescriptor.__activeConfiguration;

    /**
     * Select a business to apply to the video for personalization
     */
    const applyBusiness = useCallback(
        (businessGUID) => {
            setAppliedBusinessGUID(businessGUID);
        }, [setAppliedBusinessGUID],
    );

    /**
     * Remove the currently applied business from the video
     */
    const unapplyBusiness = useCallback(() => {
        setAppliedBusinessGUID(null);
    }, [setAppliedBusinessGUID]);

    /**
     * Select a business which is being edited in the business profile flow
     */
    const onStartEditingBusiness = useCallback(
        (businessGUID) => {
            setEditingBusinessGUID(businessGUID);
        }, [setEditingBusinessGUID],
    );

    /**
     * Cleanup when we're done editing a business in the business profile flow
     */
    const onStopEditingBusiness = useCallback(() => {
        setEditingBusinessGUID(null);
    }, [setEditingBusinessGUID]);

    //  If we have a user video, use its title as our video title, otherwise use the variant's name
    const [videoTitle, setVideoTitle] = useState(() =>
        editorUserVideo ? editorUserVideo.videoTitle : editorVariant.displayName,
    );

    const [saveDraftState, setSaveDraftState] = useState(
        // If we don't have a user video, the user should be able to save the variant without making any modifications
        editorUserVideo ? SAVE_DRAFT_STATES.saved : SAVE_DRAFT_STATES.unsaved,
    );

    // The AI VO speaker guid/text which are currently applied to the video;
    // note that this can become different from what the user has selected in the UI, but
    // should be synced when the user successfully submits the AI VO form
    const [appliedAIVoiceOverSpeakerGUID, setAppliedAIVoiceOverSpeakerGUID] = useState(
        () => editorUserVideo ? .automatedVoiceOver ? .speakerGUID || null,
    );
    const [appliedAIVoiceOverText, setAppliedAIVoiceOverText] = useState(
        () => editorUserVideo ? .automatedVoiceOver ? .text || '',
    );

    // Use a ref to keep track of our auto-save timeout so that we can cancel it if need be
    const autoSaveTimeoutRef = useRef(null);

    /**
     * Updates the configuration with a new value at all given paths
     * @param {*|func} newValueOrFunction  The new value to store in the configuration, or a function whose return value should be stored in the configuration.
     *                                      If a callback function is provided, it will receive the current value stored in the configuration at the path being updated.
     * @param {string[]}  configurationPaths  Array of dot-separated strings representing paths to the portions of the configuration object
     *                                          that should be updated with the new value
     */
    const updateConfigurationPaths = useCallback((newValueOrFunction, configurationPaths) => {
        setVideoDescriptor((currentVideoDescriptor) => {
            const currentConfiguration = currentVideoDescriptor.__activeConfiguration;

            // Don't make any changes if the new value is the same as the existing one
            const currentValue = _.get(currentConfiguration, configurationPaths[0]);

            const newValue =
                typeof newValueOrFunction === 'function' ? // If a function was provided, call it with the current value at the given path
                // and use the return value as the value we want to store in the configuration
                newValueOrFunction(currentValue) :
                newValueOrFunction;

            // If the new value isn't different, don't do anything
            if (_.isEqual(newValue, currentValue)) {
                return currentVideoDescriptor;
            }

            // Clone the existing configuration so we can modify it safely
            const newConfiguration = _.clone(currentConfiguration);

            // Clone our new value just to be safe, particularly if we're working with a value that's stored as an object
            const clonedNewValue = _.cloneDeep(newValue);

            // Update the configuration at all of the given paths with the desired new value
            configurationPaths.forEach((path) => _.set(newConfiguration, path, clonedNewValue));

            return {
                ...currentVideoDescriptor,
                __activeConfiguration: newConfiguration,
            };
        });
    }, []);

    /**
     * Updates the entire configuration wholesale to a new configuration object
     *
     * @param {object|func} newConfigurationOrFunction  The new configuration object to store, or a function which will be called with the
     *                                                    current configuration and return a new modified version to save.
     */
    const setFullConfiguration = useCallback((newConfigurationOrFunction) => {
        setVideoDescriptor((newVideoDescriptor) => {
            const currentConfiguration = newVideoDescriptor.__activeConfiguration;

            const newConfiguration = _.cloneDeep(
                typeof newConfigurationOrFunction === 'function' ?
                newConfigurationOrFunction(currentConfiguration) :
                newConfigurationOrFunction,
            );

            return {
                ...newVideoDescriptor,
                __activeConfiguration: newConfiguration,
            };
        });
    }, []);

    /**
     * Updates the video's title
     * @param {string}  newTitle  The new title to store
     */
    const updateVideoTitle = (newTitle) => setVideoTitle(newTitle);

    // Ref to keep track of whether we have made a final save before closing the editor
    const hasMadeFinalSaveRef = useRef(false);

    /**
     * Saves the current configuration and title to the user video in the db.
     * If the user is logged out, it will prompt the user to log in first.
     *
     * @param {bool} [isFinalSaveBeforeClosing=false]   Whether this is a "final save" that we are performing as the editor
     *                                                    is closed. This allows us to perform any final cleanup, ie kicking off
     *                                                    a re-render with the new changes if the video has already been purchased
     */
    const saveDraft = useEvent(async (isFinalSaveBeforeClosing = false) => {
        // This is where "saving to DB" happens

        // Clear any pending auto-save timeout
        clearTimeout(autoSaveTimeoutRef.current);

        if (isFinalSaveBeforeClosing) {
            hasMadeFinalSaveRef.current = true;
        }

        // Safely only updates our component state if the editor is not currently in the process of closing
        const safeUpdateSaveDraftState = (newSaveDraftState) => {
            if (isFinalSaveBeforeClosing) {
                return;
            }

            setSaveDraftState(newSaveDraftState);
        };

        // Update state to indicate we are now attempting to save
        safeUpdateSaveDraftState(SAVE_DRAFT_STATES.savePending);

        try {
            const stockVideoAssetKeys = getInUseStockVideoAssetKeys(
                videoDescriptor.__activeConfiguration,
            );
            const {
                userVideo,
                wasCreated
            } = await createOrUpdateSavedDraft({
                videoDescriptor,
                videoTitle,
                businessGUID: appliedBusinessGUID,
                automatedVoiceOverConfig: {
                    speakerGUID: appliedAIVoiceOverSpeakerGUID,
                    text: appliedAIVoiceOverText,
                },
                stockVideoAssetKeys,
                isFinalSaveBeforeClosing,
            });

            // Mark that our changes are successfully saved
            safeUpdateSaveDraftState(SAVE_DRAFT_STATES.saved);

            if (wasCreated && !isFinalSaveBeforeClosing) {
                // Update our URL to the route for editing the user video rather than the variant
                openUserVideoInEditor(userVideo.guid);
            }

            const waymarkSDKStore = getWaymarkSDKStore();

            if (wasCreated) {
                // Emit an event to indicate a UserVideo was created after saving this
                editorEventEmitter.emit('videoCreated', userVideo);
                waymarkSDKStore.events.onVideoCreated(userVideo);
            } else {
                waymarkSDKStore.events.onVideoSaved(userVideo);
            }

            // Emit a save event each time the video is saved after creation.
            editorEventEmitter.emit('videoSaved', userVideo);

            return userVideo;
        } catch (err) {
            // Mark that our changes failed to save due to an error
            safeUpdateSaveDraftState(SAVE_DRAFT_STATES.failed);
            console.error(err);
        }

        // Return null if something went wrong
        return null;
    });

    const [hasUserMadeEdits, setHasUserMadeEdits] = useState(false);

    const isInitialRenderRef = useRef(true);

    // Effect kicks off an auto-save after a delay if the user has made changes
    useEffect(() => {
        if (isInitialRenderRef.current) {
            // If this effect is just running because it's the initial render
            // rather than because we have unsaved changes, just return early
            isInitialRenderRef.current = false;
            return undefined;
        }

        // Emit an event to indicate the video has been edited
        editorEventEmitter.emit('videoEdited');
        setHasUserMadeEdits(true);

        // Mark that a save attempt is now in progress
        setSaveDraftState(SAVE_DRAFT_STATES.savePending);

        // Set a new timeout to attempt to update the draft with its unsaved changes
        // in 1 second.
        autoSaveTimeoutRef.current = setTimeout(() => saveDraft(), 1000);

        // Clear any pending auto-save attempt on cleanup
        return () => {
            clearTimeout(autoSaveTimeoutRef.current);
        };
    }, [
        saveDraft,
        // Effect dependencies for values which we want to save when they change
        videoDescriptor,
        videoTitle,
        appliedBusinessGUID,
        appliedAIVoiceOverSpeakerGUID,
        appliedAIVoiceOverText,
    ]);

    const hasVideoBeenSavedBefore = saveDraftState !== SAVE_DRAFT_STATES.unsaved;

    useEffect(() => {
        if (isUserLoggedIn && hasVideoBeenSavedBefore && hasUserMadeEdits) {
            // If the user is logged in and they have previously saved the video at least once, perform a "final save" which will also
            // perform additional cleanup/preview rendering if necessary
            const saveBeforeUnload = () => {
                if (!hasMadeFinalSaveRef.current) {
                    // If a final save hasn't been made yet, perform one now before the page is closed
                    // (this will happen after clicking the "Finish" button to complete a video)
                    saveDraft(true);
                }
            };

            window.addEventListener('beforeunload', saveBeforeUnload);

            return () => {
                // If this cleanup function is running, that means the page is being closed in a way that didn't trigger onBeforeUnload (ie, via react-router)
                // In this case, make sure we manually kick off a render now instead
                saveBeforeUnload();

                window.removeEventListener('beforeunload', saveBeforeUnload);
            };
        }

        return undefined;
    }, [hasVideoBeenSavedBefore, isUserLoggedIn, saveDraft, hasUserMadeEdits]);

    // These state context values change so often that memoizing them
    // will likely cause more harm than good as far as performance goes.
    // The real solution is that we need to break all of these things out so they aren't
    // all centralized in one single context provider
    /** @type {EditorStateContextValue} */
    const stateValues = {
        configuration,
        videoDescriptor,
        defaultConfiguration: editorVariant.videoDescriptor.__activeConfiguration,
        videoTitle,
        saveDraftState,
        accountName,
        appliedBusinessGUID,
        allBusinessesForAccount,
        isLoadingAllBusinesses,
        editingBusinessGUID,
        editingBusinessDetails,
        isEditingBusinessLoading,
        appliedBusinessDetails,
        isAppliedBusinessLoading,
        appliedAIVoiceOverSpeakerGUID,
        appliedAIVoiceOverText,
    };

    // Dispatch functions don't change as often so these are fairly safe to wrap in a useMemo
    const dispatchValues = useMemo(
        () => ({
            updateConfigurationPaths,
            setFullConfiguration,
            setVideoDescriptor,
            updateVideoTitle,
            saveDraft,
            applyBusiness,
            unapplyBusiness,
            onStartEditingBusiness,
            onStopEditingBusiness,
            refetchBusinessesForAccount,
            setAppliedAIVoiceOverSpeakerGUID,
            setAppliedAIVoiceOverText,
        }), [
            applyBusiness,
            onStartEditingBusiness,
            onStopEditingBusiness,
            refetchBusinessesForAccount,
            saveDraft,
            setFullConfiguration,
            unapplyBusiness,
            updateConfigurationPaths,
        ],
    );

    return ( <
        EditorStateContext.Provider value = {
            stateValues
        } >
        <
        EditorDispatchContext.Provider value = {
            dispatchValues
        } > {
            children
        } <
        /EditorDispatchContext.Provider> <
        /EditorStateContext.Provider>
    );
}
EditorStateProvider.propTypes = {
    createOrUpdateSavedDraft: PropTypes.func.isRequired,
    openUserVideoInEditor: PropTypes.func.isRequired,
    isUserLoggedIn: PropTypes.bool.isRequired,
    appliedBusinessGUID: PropTypes.string,
    setAppliedBusinessGUID: PropTypes.func.isRequired,
    appliedBusinessDetails: coreBusinessDetailsPropType,
    isAppliedBusinessLoading: PropTypes.bool.isRequired,
    editingBusinessGUID: PropTypes.string,
    setEditingBusinessGUID: PropTypes.func.isRequired,
    editingBusinessDetails: coreBusinessDetailsPropType,
    isEditingBusinessLoading: PropTypes.bool.isRequired,
    accountName: PropTypes.string,
    allBusinessesForAccount: PropTypes.arrayOf(coreBusinessDetailsPropType).isRequired,
    isLoadingAllBusinesses: PropTypes.bool.isRequired,
    refetchBusinessesForAccount: PropTypes.func.isRequired,
    children: sharedPropTypes.children.isRequired,
};