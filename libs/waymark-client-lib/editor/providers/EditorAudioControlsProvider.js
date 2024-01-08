// Vendor
import _ from 'lodash';
import {
    createContext,
    useContext,
    useEffect,
    useState
} from 'react';

// Editor
import {
    useEditorVideoContext
} from 'editor/providers/EditorVideoProvider.js';
import {
    useEditorDispatch,
    useEditorState
} from 'editor/providers/EditorStateProvider.js';
import {
    editorAudioConfigurationPaths
} from 'editor/constants/EditorAudio.js';

// Shared
import sharedPropTypes from 'shared/components/propTypes/index.js';
import {
    replaceOrAdd
} from 'shared/utils/collections.js';
import {
    usePauseVideoPlayback,
    useVideoTemplateConfigurator,
} from 'shared/web_video/providers/VideoTemplateConfiguratorProvider';

// Waymark App Dependencies
import {
    actionTypes
} from 'app/constants/ConfigurationInterpreterSchema.js';

const EditorAudioControlsContext = createContext();

export const useAudioControlsContext = () => useContext(EditorAudioControlsContext);

/**
 * Provides the editor with current audio values and controls for the
 * main audio layer and the auxiliary audio layer if it exists
 *
 * NOTE: These controls are typically provided by the EditorFormDescriptionProvider,
 * but we are starting to explore a new world of dynamic layers that
 * can be added and removed and won't be represented in the editing
 * form description. Rather than try to fit all of this functionality
 * into the old way of managing things, this provider relies on the
 * configuration and updates it directly rather than traversing the
 * paths defined in the editing form description.
 */
export default function EditorAudioControlsProvider({
    children
}) {
    const {
        editorVariant
    } = useEditorVideoContext();
    const {
        updateConfigurationPaths
    } = useEditorDispatch();
    const {
        configuration
    } = useEditorState();
    const configurator = useVideoTemplateConfigurator();

    const pauseVideoPlayback = usePauseVideoPlayback();

    // Main audio (background audio) settings
    const [mainAudioVolumePath, setMainAudioVolumePath] = useState('');
    const mainAudioVolumeSettings = configuration[mainAudioVolumePath] || {};
    const {
        volume: mainAudioVolume = 1
    } = mainAudioVolumeSettings;

    // Auxiliary audio (voice-over audio) settings
    const auxiliaryAudioPath = editorAudioConfigurationPaths.auxiliaryAudio;
    const auxiliaryAudioValue = _.get(configuration, auxiliaryAudioPath);
    const auxiliaryAudioVolume = _.get(auxiliaryAudioValue, 'volume', 1);

    // Whether or not we should show the volume slider for background audio
    const [isMainAudioVolumeControlEnabled, setIsMainAudioVolumeControlEnabled] = useState(true);

    const [masterVolumeChanges, setMasterVolumeChanges] = useState(undefined);

    /**
     * Modify each volume change in an array by passing the target volume
     * to the provided adjustment function
     *
     * @param {array} volumeChanges
     * @param {function} adjustmentFunction
     * @returns Array of modified volume changes
     */
    const adjustVolumeChanges = (volumeChanges, adjustmentFunction) =>
        volumeChanges.map((volumeChange) => ({
            ...volumeChange,
            targetVolume: volumeChange.targetVolume === 1 ? 1 : adjustmentFunction(volumeChange.targetVolume),
        }));

    // Once the configuration has loaded, grab the volume changes off of the main
    // audio layer and normalize them. These will be used to apply volume changes to
    // new audio selections and represent background audio ducking in the UI.
    useEffect(() => {
        if (masterVolumeChanges === undefined && !_.isEmpty(configuration) && mainAudioVolumePath) {
            const audioSettings = configuration[mainAudioVolumePath] || {};

            const normalizedVolumeChanges = adjustVolumeChanges(
                audioSettings.volumeChanges || [],
                (targetVolume) => targetVolume / mainAudioVolume,
            );

            setMasterVolumeChanges(normalizedVolumeChanges);
        }
    }, [masterVolumeChanges, mainAudioVolume, configuration, mainAudioVolumePath]);

    // Once we have a variant the configurator has loaded, find the `LAYER_AUDIO` editing action
    // and store the path so we can target the correct layer for background audio
    // volume and volumeChanges
    useEffect(() => {
        if (editorVariant && configurator) {
            const {
                editingActions
            } = configurator;

            const audioPropertiesEditingAction = editingActions.events.find((editingAction) => {
                if (editingAction.actions.length > 0) {
                    return editingAction.actions[0].type === actionTypes.audioLayerProperties;
                }

                return false;
            });

            if (audioPropertiesEditingAction) {
                setMainAudioVolumePath(audioPropertiesEditingAction.path);
            } else {
                // eslint-disable-next-line no-console
                console.log(
                    `%cMisconfigured editing actions for ${editorVariant.videoTemplateSlug} - unable to find background audio layer UUID. This means we are unable to target the volume on this layer and volume controls for background audio will be disabled.`,
                    'color: white; background-color: red; padding: 4px; border-radius:2px',
                    editingActions,
                );
                // If we did not find a layer UUID for the main audio layer, we can't target it for
                // volume controls.
                //
                // NOTE: This is a fail safe so that we don't provide a broken editor experience, but
                // this should NOT be happening. If we can't find the main audio layer UUID in the
                // editing actions it means that our logic to manipulate the template bundle in the
                // Configurator has failed and we need to revisit it ASAP.
                setIsMainAudioVolumeControlEnabled(false);
            }
        }
    }, [editorVariant, configurator]);

    /**
     * Apply updated volume changes to all valid audio layers
     *
     * @param {array} updatedVolumeChanges
     */
    const updateLayerVolumeChanges = (updatedVolumeChanges) => {
        // The main audio layer should always exist, update it automatically
        const adjustedMainVolumeChanges = adjustVolumeChanges(
            updatedVolumeChanges,
            (targetVolume) => targetVolume * mainAudioVolume,
        );

        updateConfigurationPaths(adjustedMainVolumeChanges, [`${mainAudioVolumePath}.volumeChanges`]);

        // If an auxiliary audio layer has been added, update its volume changes
        if (auxiliaryAudioValue) {
            const adjustedAuxiliaryVolumeChanges = adjustVolumeChanges(
                updatedVolumeChanges,
                (targetVolume) => targetVolume * auxiliaryAudioVolume,
            );
            updateConfigurationPaths(adjustedAuxiliaryVolumeChanges, [
                `${auxiliaryAudioPath}.volumeChanges`,
            ]);
        }
    };

    /**
     * Sets the volume change object for a given target
     *
     * @param {string} target Video layer GUID
     * @param {number} targetVolume Volume audio should duck to
     */
    const setVolumeChangeForTarget = (target, targetVolume) => {
        const updatedVolumeChanges = replaceOrAdd(
            masterVolumeChanges, {
                type: 'targetDucking',
                duckingTarget: target,
                targetVolume,
            },
            'duckingTarget',
        );

        setMasterVolumeChanges(updatedVolumeChanges);
        // Apply new volume changes to audio layers
        updateLayerVolumeChanges(updatedVolumeChanges);
    };

    /**
     * Find the current volume change for a given layer
     *
     * @param {string} target Video layer GUID
     * @returns {object} Volume change
     */
    const getVolumeChangeForTarget = (target) =>
        masterVolumeChanges.find((volumeChange) => volumeChange.duckingTarget === target);

    /**
     * Updates the configuration value for a given path with new volume settings
     * Method normalizes the new volume value between 0 and 1, which is what the renderer
     * expects, and adjusts the layer's volume changes based on the new volume
     *
     * @param {number} newVolume New layer volume
     * @param {object} layerData Current data for the layer
     * @param {string} path Configuration path to apply new values to
     */
    const updateLayerVolume = (newVolume, layerData, path) => {
        pauseVideoPlayback();

        const normalizedVolume = newVolume / 100;
        const currentVolume = path === auxiliaryAudioPath ? auxiliaryAudioVolume : mainAudioVolume;

        const isMuted = normalizedVolume === 0;
        // If the layer is being muted, store the most recent volume in the
        // configuration instead of setting it to zero so we can toggle back
        // to the last known volume if the user un-mutes the layer
        const volume = isMuted ? currentVolume : normalizedVolume;
        // Re-calculate the correct values for the layer's volume changes
        // based on the new volume
        const volumeChanges = adjustVolumeChanges(
            masterVolumeChanges,
            (targetVolume) => targetVolume * normalizedVolume,
        );

        updateConfigurationPaths({
            ...layerData,
            isMuted,
            volume,
            volumeChanges,
        }, [path], );
    };

    /**
     * Helper function to update the main audio layer's volume
     *
     * @param {number} newVolume New main audio layer volume
     */
    const updateMainLayerVolume = (newVolume) =>
        updateLayerVolume(newVolume, mainAudioVolumeSettings, mainAudioVolumePath);

    /**
     * Helper function to update the auxiliary audio layer's volume
     *
     * @param {number} newVolume New auxiliary audio layer volume
     */
    const updateAuxiliaryLayerVolume = (newVolume) =>
        updateLayerVolume(newVolume, auxiliaryAudioValue, auxiliaryAudioPath);

    return ( <
        EditorAudioControlsContext.Provider value = {
            {
                // Represent the auxiliary audio layer as null if there is no value
                auxiliaryAudioLayer: auxiliaryAudioValue || null,
                mainAudioVolumeSettings,
                mainAudioVolumePath,
                getVolumeChangeForTarget,
                isMainAudioVolumeControlEnabled,
                masterVolumeChanges,
                setVolumeChangeForTarget,
                updateAuxiliaryLayerVolume,
                updateMainLayerVolume,
            }
        } >
        {
            children
        } <
        /EditorAudioControlsContext.Provider>
    );
}

EditorAudioControlsProvider.propTypes = {
    children: sharedPropTypes.children.isRequired,
};