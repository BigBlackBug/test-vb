import _ from 'lodash';
import {
    useCallback
} from 'react';

import {
    useEditorDispatch,
    useEditorState
} from 'editor/providers/EditorStateProvider.js';
import {
    editorAudioConfigurationPaths
} from 'editor/constants/EditorAudio.js';

/**
 * Collect waymarkAudio paths from the configuration.
 *
 * Returns a copy of the configuration containing only properties whose key starts with 'waymarkAudio--'.
 */
function collectWaymarkAudio(configuration) {
    return _.pickBy(configuration, (value, key) => key.startsWith('waymarkAudio--'));
}

/**
 * Given a new configuration object, incorporate its auxiliaryAudio into a copy of the current
 * configuration, and apply any 'waymarkAudio--' properties to adjust volume.
 */
export function useApplyAuxiliaryAudioToConfiguration() {
    const {
        configuration
    } = useEditorState();
    const {
        setFullConfiguration
    } = useEditorDispatch();
    const auxiliaryAudioPath = editorAudioConfigurationPaths.auxiliaryAudio;
    return useCallback(
        async (newConfiguration) => {
            const newAuxiliaryAudioValue = _.get(newConfiguration, auxiliaryAudioPath);
            const newWaymarkAudio = collectWaymarkAudio(newConfiguration);
            return setFullConfiguration((currentConfiguration) => {
                let finalConfiguration = _.cloneDeep(currentConfiguration);
                _.set(finalConfiguration, auxiliaryAudioPath, newAuxiliaryAudioValue);
                _.assign(finalConfiguration, newWaymarkAudio);
                return finalConfiguration;
            });
        }, [configuration, setFullConfiguration],
    );
}