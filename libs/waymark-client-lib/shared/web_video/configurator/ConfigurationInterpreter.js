// Vendor
import _ from 'lodash';
import Ajv from 'ajv';

// Local
import {
    actionTypes,
    actionSetTypes,
    caseOperations,
    dynamicLayerTypes,
    valueOperations,
    configurationInterpreterSchema,
} from 'app/constants/ConfigurationInterpreterSchema.js';
import {
    hexStringToBase16
} from 'shared/utils/colors.js';
import {
    getEditingActionChangePath
} from 'shared/web_video/utils/ConfigurationUtils.js';
import {
    findLayerData
} from 'shared/WaymarkAuthorWebRenderer.js';
import {
    VideoConfiguration
} from '@libs/shared-types';

/**
 * Helper class for receiving inputs from a video editor
 * a video editor form, and translating those inputs into
 * WaymarkPixiRender actions.
 *
 * Configuration change events are asynchronous and if a
 * configuration change triggers multiple changes to the
 * renderer, such as a theme or logo mode change, these
 * events will run in parallel.
 */
class ConfigurationInterpreter {
    constructor(renderer, editingActions, templateManifest) {
        this.isRunning = false;
        this.renderer = renderer;
        /** @type {VideoConfiguration} */
        this.videoConfiguration = {};
        this.templateManifest = templateManifest;

        if (editingActions) {
            this.loadEditingActions(editingActions);
        } else {
            this.editingActions = null;
        }
    }

    /**
     * Load an interpreter configuration.
     * See ConfigurationInterpreterSchema.js for a breakdown
     * of configuration elements.
     *
     * @param  {object}  configuration  Interpreter configuration
     */
    loadEditingActions = (editingActions) => {
        const ajv = new Ajv({
            allErrors: true
        });
        const validator = ajv.compile(configurationInterpreterSchema);

        const isValid = validator(editingActions);
        if (!isValid) {
            console.error('editingActions validation errors: ', validator.errors);
            return;
        }

        this.editingActions = editingActions;
    };

    /**
     * Load a video configuration.
     *
     * @param  {VideoConfiguration}  videoConfiguration  Video configuration
     */
    loadVideoConfiguration = (videoConfiguration) => {
        this.videoConfiguration = _.cloneDeep(videoConfiguration);
    };

    /**
     * Construct a set of renderer changes based on a single action.
     * This should not be called for dynamic layers, e.g. `auxiliaryAudio`since
     * they do not have a corresponding editing action.
     *
     * @param  {object}                        action      Single action
     * @param  {string|number|boolean|object}  eventValue  Event value
     * @return {object[]}   Array of changes to pass to the renderer to execute.
     */
    static getChangesFromAction(action, eventValue) {
        let value;

        // Determine the final event value using the operation
        // specified on the action.
        switch (action.value.operation) {
            case valueOperations.setExplicit:
                {
                    value = action.value.payload;
                    break;
                }

            case valueOperations.passthrough:
                {
                    value = eventValue;
                    break;
                }

            default:
                {
                    break;
                }
        }

        switch (action.type) {
            case actionTypes.textFontProperties:
                {
                    return action.targets.map((target) => {
                        const {
                            fontVariantUUID,
                            fontFamily,
                            fontWeight,
                            fontStyle,
                            fontSizeAdjustment
                        } = value;

                        const payload = {
                            layer: target,
                            fontVariantUUID,
                            fontSizeAdjustment,
                            fontFamily,
                            fontWeight,
                            fontStyle,
                        };

                        return {
                            type: action.type,
                            payload
                        };
                    });
                }

            case actionTypes.waymarkAudioAsset:
                {
                    /* Expect action value to be in the form
                      { type, modifications, location }
                    */
                    return action.targets.map((target) => {
                        const payload = {
                            layer: target,
                            asset: value,
                        };

                        return {
                            type: action.type,
                            payload
                        };
                    });
                }

            case actionTypes.displayObjectVisibility:
                {
                    return action.targets.map((target) => {
                        const payload = {
                            layer: target,
                            isVisible: value,
                        };
                        return {
                            type: action.type,
                            payload
                        };
                    });
                }

            case actionTypes.shapeFillColor:
                {
                    return action.targets.map((target) => {
                        const payload = {
                            layer: target,
                            color: hexStringToBase16(value),
                        };

                        return {
                            type: action.type,
                            payload
                        };
                    });
                }

            case actionTypes.shapeGradientFillColor:
                {
                    // Each target can translate into multiple changes, so let's flatten the response.
                    return _.flatten(
                        action.targets.map((target) =>
                            Object.entries(value).map(([stepIndex, colorHex]) => {
                                const payload = {
                                    stepIndex: parseInt(stepIndex, 10),
                                    layer: target,
                                    color: hexStringToBase16(colorHex),
                                };
                                return {
                                    type: action.type,
                                    payload
                                };
                            }),
                        ),
                    );
                }

            case actionTypes.solidFillColor:
                {
                    return action.targets.map((target) => {
                        const payload = {
                            layer: target,
                            color: hexStringToBase16(value),
                        };

                        return {
                            type: action.type,
                            payload
                        };
                    });
                }

            case actionTypes.effectFillColor:
                {
                    return action.targets.map((target) => {
                        const payload = {
                            layer: target,
                            color: hexStringToBase16(value),
                        };

                        return {
                            type: action.type,
                            payload
                        };
                    });
                }

            case actionTypes.shapeStrokeColor:
                {
                    return action.targets.map((target) => {
                        const payload = {
                            layer: target,
                            color: hexStringToBase16(value),
                        };

                        return {
                            type: action.type,
                            payload
                        };
                    });
                }

            case actionTypes.imageAsset:
                {
                    /* Expect action value to be in the form
                      { type, modifications, location }
                    */
                    return action.targets.map((target) => {
                        const payload = {
                            layer: target,
                            asset: value,
                        };
                        return {
                            type: action.type,
                            payload
                        };
                    });
                }

            case actionTypes.imageLayerProperties:
                {
                    /* Expect action value to be in the form
                      {content: { type, modifications, location }, ...otherLayerData}
                    */
                    return action.targets.map((target) => {
                        let payload;
                        // NOTE: This is a bit of a hacky fix due to the nature of supporting legacy editing actions
                        //       When dealing with imageOverrides, they are stored in the configuration without AS the content
                        //       (not the whole layer data) So in cases where the value is an object without content or
                        //       content without a location (as I have seen in a handful of configurations), we assume that this
                        //       is the configuration for an imageOverride and we wrap it accordingly.
                        // TODO: This will have to be dealt with when we want to fully support LAYER_IMAGE change operations
                        if (!value.content || !value.content.location) {
                            payload = {
                                layer: target,
                                content: {
                                    ...value,
                                },
                            };
                        } else {
                            payload = {
                                layer: target,
                                ...value,
                            };
                        }

                        return {
                            type: action.type,
                            payload
                        };
                    });
                }

            case actionTypes.imagePath:
                {
                    return action.targets.map((target) => {
                        const payload = {
                            layer: target,
                            path: value,
                            shouldResize: true,
                        };

                        return {
                            type: action.type,
                            payload
                        };
                    });
                }

            case actionTypes.textContent:
                {
                    return action.targets.map((target) => {
                        const payload = {
                            layer: target,
                            text: value,
                        };
                        return {
                            type: action.type,
                            payload
                        };
                    });
                }

            case actionTypes.textFillColor:
                {
                    return action.targets.map((target) => {
                        const payload = {
                            layer: target,
                            color: hexStringToBase16(value),
                        };

                        return {
                            type: action.type,
                            payload
                        };
                    });
                }

            case actionTypes.textStrokeColor:
                {
                    return action.targets.map((target) => {
                        const payload = {
                            layer: target,
                            color: hexStringToBase16(value),
                        };

                        return {
                            type: action.type,
                            payload
                        };
                    });
                }

            case actionTypes.videoLayerResource:
                {
                    const payload = {
                        asset: value,
                    };

                    return [{
                        type: action.type,
                        payload
                    }];
                }

            case actionTypes.videoLayerProperties:
                {
                    return action.targets.map((target) => {
                        const payload = {
                            layer: target,
                            ...value,
                        };

                        return {
                            type: action.type,
                            payload
                        };
                    });
                }

            case actionTypes.audioLayerProperties:
                {
                    return action.targets.map((target) => {
                        const payload = {
                            layer: target,
                            ...value,
                        };

                        return {
                            type: action.type,
                            payload
                        };
                    });
                }

            default:
                return [];
        }
    }

    /**
     * Determine if a layer can be dynamically added to video via the renderer
     *
     * @param {str} layerType Layer type
     * @returns {bool} Whether or not the layer type exists in the `dynamicLayerTypes` constant
     */
    static isDynamicLayer(layerType) {
        return Boolean(dynamicLayerTypes[layerType]);
    }

    /**
     * Construct dynamic layer renderer changes for the provided configuration value
     * The only dynamic layer type we currently support is `auxiliaryAudio`
     *
     * @param {str} layer Dynamic layer configuration key
     * @param {str|int|bool|obj}  payload Configuration value for dynamic layer
     * @return {object[]}   Array of renderer changes.
     */
    getDynamicLayerChange(layer, payload) {
        switch (layer) {
            case dynamicLayerTypes.auxiliaryAudio:
                {
                    // Dynamic layers are searched by their common ID rather than their Studio-assigned UUID
                    // Prepend `#` to the layer name so that the layer is correctly identified
                    const layerName = `#${layer}`;

                    let options;
                    // If we don't provide a payload, that means the item has been removed from the configuration
                    // and we should also remove the layer from the renderer
                    if (!payload) {
                        options = {
                            shouldDelete: true
                        };
                    } else {
                        // eslint-disable-next-line no-underscore-dangle
                        const existingLayer = this.renderer._isSetup ?
                            this.renderer.findLayer(layerName) :
                            findLayerData(this.templateManifest, layerName);
                        options = {
                            shouldAdd: !existingLayer
                        };
                    }

                    return [{
                        type: actionTypes.audioLayerProperties,
                        payload: {
                            layer: layerName,
                            ...payload,
                            options
                        },
                    }, ];
                }

            default:
                {
                    console.error(`Unsupported dynamic layer type: ${layer}`);
                    return [];
                }
        }
    }

    /**
     * Gets a set of changes to pass to the renderer from an array of actions.
     * Currently actions arrays are the only action set type
     * that actually fires actions (switch actions serve as
     * a filter that must result in an action array, if
     * anything).
     *
     * @param  {array}                         actions     Array of actions
     * @param  {string|number|boolean|object}  eventValue  Event value
     * @return {object[]}   Array of renderer changes.
     */
    getChangesFromActionsArray(actions, eventValue) {
        if (!(actions instanceof Array)) {
            console.error('getChangesFromActionsArray called on non-array');
            return [];
        }
        // Iterate through the actions array and construct a single list of renderer changes.
        return actions.reduce(
            (accumulator, action) =>
            accumulator.concat(this.constructor.getChangesFromAction(action, eventValue)), [],
        );
    }

    /**
     * Interprets and actions switch object and translates it into an array of renderer changes.
     * Actions switch sets contain cases that can be evaluated
     * to filter more actions sets. Currently the only case
     * operation supported is "equals", which will evaluate an
     * actions set iff the case value equals the input event
     * value.
     *
     * @param  {object}                         actions    Actions switch object
     * @param  {string|number|boolean|object}  eventValue  Event value
     * @return {object[]}   Array of renderer changes.
     */
    getChangesFromActionsSwitch(actions, eventValue) {
        if (actions.type !== actionSetTypes.switch) {
            console.error('getChangesFromActionsSwitch called on non-switch');
            return [];
        }

        return actions.switch.reduce((accumulatedChanges, switchCase) => {
            switch (switchCase.operation) {
                case caseOperations.equals:
                    {
                        if (eventValue === switchCase.case) {
                            return accumulatedChanges.concat(
                                this.getRendererChanges(switchCase.actions, eventValue),
                            );
                        }
                        return accumulatedChanges;
                    }
                default:
                    {
                        console.error('Missing case operation');
                        return accumulatedChanges;
                    }
            }
        }, []);
    }

    /**
     * Parses an actions array or object and returns an array of corresponding renderer changes.
     * This is the entry point for any actions array or object
     * of an unknown type. This may be recursively called by
     * actions types that can contain nested sets, such as switch
     * actions sets.
     *
     * @param  {array|object}                  actions     Array or object of actions
     * @param  {string|number|boolean|object}  eventValue  Event value
     * @return {object[]} Array of changes to provide to the renderer.
     */
    getRendererChanges(actions, eventValue) {
        if (actions instanceof Array) {
            return this.getChangesFromActionsArray(actions, eventValue);
        }
        if (actions instanceof Object) {
            if (actions.type === actionSetTypes.switch) {
                return this.getChangesFromActionsSwitch(actions, eventValue);
            }
        }

        console.error(`Unknown actions requested: ${actions}`);
        return [];
    }

    /**
     * Get a Waymark author renderer compatible change list for a new video configuration.
     *
     * @param   {VideoConfiguration}    videoConfiguration  New video configuration
     * @return  {[object]}                      List of renderer changes
     */
    getConfigurationChangeList = async (videoConfiguration) => {
        const editingActionsChangeList = Object.keys(videoConfiguration).reduce((changes, path) => {
            const changePath = getEditingActionChangePath(path);

            const oldValue = _.get(this.videoConfiguration, changePath);
            const newValue = _.get(videoConfiguration, changePath);

            // Return if the value was not updated
            if (_.isEqual(oldValue, newValue)) {
                return changes;
            }

            // If there is an editing action defined for the path, use it to construct the renderer changes
            const editingActionForPath = _.find(
                _.get(this.editingActions, 'events'),
                (event) => event.path === changePath,
            );

            if (editingActionForPath) {
                return changes.concat(this.getRendererChanges(editingActionForPath.actions, newValue));
            }

            // If not, check if this is a dynamic layer (a layer that can be added)
            // If it's not, we're looking at a configuration item that is not directly editable,
            // e.g. shapes, precomps
            const isDynamicLayer = this.constructor.isDynamicLayer(path);
            if (!isDynamicLayer) {
                return changes;
            }

            return changes.concat(this.getDynamicLayerChange(path, newValue));
        }, []);

        // Get a list of layers that existed in the previous configuration, but not the new one
        const deletedPaths = _.difference(
            Object.keys(this.videoConfiguration),
            Object.keys(videoConfiguration),
        );

        // Construct a change operation for each deleted layer to remove it from the renderer data
        deletedPaths.forEach((deletedPath) => {
            const isDynamicLayer = this.constructor.isDynamicLayer(deletedPath);
            if (!isDynamicLayer) {
                console.error(`Trying to delete non-dynamic layer: ${deletedPath}`);
            } else {
                editingActionsChangeList.push(this.getDynamicLayerChange(deletedPath)[0]);
            }
        });

        return editingActionsChangeList;
    };

    /**
     * Receive a new video configuration.
     *
     * @param  {VideoConfiguration}  videoConfiguration   A video template variant configuration
     */
    handleConfigurationChange = async (videoConfiguration) => {
        if (!this.editingActions) {
            console.error('No interpreter configuration loaded');
            return;
        }

        if (this.isRunning) {
            console.warn('Configuration change is already being applied');
            return;
        }
        this.isRunning = true;

        const changesList = await this.getConfigurationChangeList(videoConfiguration);

        this.loadVideoConfiguration(videoConfiguration);

        // The following is a hack.
        // What we SHOULD be doing is just listening for all `applyChangeList:end` events (or something similar)
        // and always syncing that to the database. But, for now, it's not that simple. The way our auto-save
        // works (among other things) means that listening to `applyChangeList:end` will lead to new drafts being
        // created every time you open a template from the template browser. So... we *really* need to sync the changes
        // from audio change events because it leads to a new audio layer in the project manifest. Because of this, we're
        // manually calling `applyChange` for those changes so that `applyChange:end` is triggered.
        const nonAudioChangeOperations = changesList.filter((change) => change.type !== 'LAYER_AUDIO');
        const audioChangeOperations = changesList.filter((change) => change.type === 'LAYER_AUDIO');

        if (nonAudioChangeOperations.length > 0) {
            await this.renderer.applyChangeList(nonAudioChangeOperations);
        }

        for (const changeOperation of audioChangeOperations) {
            await this.renderer.applyChange(changeOperation.type, changeOperation.payload);
        }

        this.isRunning = false;
    };
}

export default ConfigurationInterpreter;