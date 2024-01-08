// Vendor
import _ from 'lodash';
import {
    createContext,
    useContext,
    useEffect,
    useState,
    useMemo,
    useCallback
} from 'react';
import PropTypes from 'prop-types';

// Editor
import {
    useEditorVideoContext
} from 'editor/providers/EditorVideoProvider.js';
import {
    useEditorState,
    useEditorDispatch
} from 'editor/providers/EditorStateProvider.js';
import {
    useAudioControlsContext
} from 'editor/providers/EditorAudioControlsProvider.js';
import {
    formatEditorFormDescription
} from 'editor/utils/editorForm.js';
import {
    VideoEditingFieldTypes
} from 'editor/constants/Editor';
import {
    editorAudioConfigurationPaths
} from 'editor/constants/EditorAudio.js';
import {
    ImageModificationKeys,
    defaultFitFillMode as defaultImageFitFillMode,
    DefaultImageModifications,
} from 'editor/constants/EditorImage.js';
import {
    defaultFitFillMode as defaultVideoFitFillMode,
    defaultFitFillModeModifications as defaultVideoFitFillModeModifications,
    baseDefaultModifications as baseDefaultVideoModifications,
    videoAssetPluginType,
} from 'editor/constants/EditorVideo.js';
import editorEventEmitter from 'editor/utils/editorEventEmitter.js';

// Shared
import WaymarkAuthorBundleManager from 'shared/web_video/utils/WaymarkAuthorBundleManager.js';
import videoProcessingService from 'shared/web_video/utils/videoProcessingService';
import {
    getWaymarkLocationSources,
    getAssetUrl
} from 'shared/WaymarkAuthorWebRenderer.js';
import {
    getURLWithoutQueryParams,
    getURLParts
} from 'shared/utils/urls.js';
import sharedPropTypes from 'shared/components/propTypes/index.js';
import {
    useJumpVideoToTime,
    usePauseVideoPlayback,
} from 'shared/web_video/providers/VideoTemplateConfiguratorProvider';
import {
    NESTED_GUID_REGEX_PATTERN
} from 'shared/utils/uuid.js';
import {
    useVideoAssetURL
} from 'shared/web_video/hooks/useVideoAssetURL';

/**
 * Takes an image modification object and, based on the fit parameter, validates the
 * keys that are present and fills in any missing keys with defaut values.
 * @param  {object}   modifications   Image modifications object.
 * @param  {object}   imageField      Editor image field.
 * @return {object}                   Validated image modifications object.
 */
export const validateImageModifications = (modifications) => {
    if (_.isEmpty(modifications)) {
        return modifications;
    }

    let fitFillMode = modifications.fit;

    if (!fitFillMode) {
        // If no fit/fill mode is explicitly set, fall back to the default mode
        fitFillMode = defaultImageFitFillMode;
    }

    // Adjustments play nicely with all image modifications.
    const allowedModificationKeys = [
        ImageModificationKeys.adjustments,
        ...Object.keys(DefaultImageModifications[fitFillMode]),
    ];

    // Remove any invalid keys and fill in any missing values with defaults.
    return _.defaultsDeep(
        _.pick(modifications, allowedModificationKeys),
        DefaultImageModifications[fitFillMode],
    );
};

/**
 * Hook returns value for given path from the current video configuration.
 *
 * @param {string} path: Configuration path.
 */
const useConfigurationValue = (path) => {
    const {
        configuration
    } = useEditorState();

    return _.get(configuration, path);
};

/**
 * Takes a raw editor field from the form description and returns a rich editor field with
 * various hooks that will enable accessing or updating the configuration value
 */
const getBaseRichEditorField = (editorField) => {
    // Hook returns a function which will update the field's configuration value with a new given value
    const useUpdateConfigurationValue = () => {
        const {
            updateConfigurationPaths
        } = useEditorDispatch();

        return useCallback(
            (newValue) => updateConfigurationPaths(newValue, editorField.paths), [updateConfigurationPaths],
        );
    };

    // Hook returns the field's default configuration value
    const useDefaultConfigurationValue = () => {
        const {
            defaultConfiguration
        } = useEditorState();

        return useMemo(() => _.get(defaultConfiguration, editorField.paths[0]), [defaultConfiguration]);
    };

    /**
     * Remove a property from the current configuration
     *
     * @param {string} layerPath Key of object to delete
     */
    const useRemoveLayerFromConfiguration = () => {
        const {
            configuration
        } = useEditorState();
        const {
            setFullConfiguration
        } = useEditorDispatch();

        return (layerPath) => {
            const updatedConfiguration = { ...configuration
            };
            delete updatedConfiguration[layerPath];
            setFullConfiguration(updatedConfiguration);
        };
    };

    return {
        ...editorField,
        // Hook returns the field's current configuration value
        useCurrentConfigurationValue: () => useConfigurationValue(editorField.paths[0]),
        useUpdateConfigurationValue,
        useDefaultConfigurationValue,
        // Hook returns a function that will reset the field back to its variant default value
        useResetToDefaultConfigurationValue: () => {
            const defaultConfigurationValue = useDefaultConfigurationValue();
            const updateConfigurationValue = useUpdateConfigurationValue();

            return () => updateConfigurationValue(defaultConfigurationValue);
        },
        useRemoveLayerFromConfiguration,
    };
};

/**
 * Retrieving and updating a font field's configuration values works a little differently
 * with "respected paths" and font overrides so we need special handling to create a rich font field
 */
const getRichFontField = (fontField) => {
    // Get the configuration paths that will be best to retrieve a configuration value from
    // for this field
    const respectedPaths = Object.keys(fontField.respectedPathMappings);

    // Get an array of this field's font overrides which will all need to be updated
    // when changing this field's value
    const fontOverrides = Object.values(fontField.fontOverrides);

    return {
        ...fontField,
        // Hook returns the field's current configuration value
        useCurrentConfigurationValue: () => {
            const {
                configuration
            } = useEditorState();

            return _.get(configuration, respectedPaths[0]);
        },
        // Hook returns a function which will update the font field's configuration value
        useUpdateConfigurationValue: () => {
            const {
                updateConfigurationPaths
            } = useEditorDispatch();

            return useCallback(
                (newFont) => {
                    fontOverrides.forEach(({
                        originalTypography,
                        paths
                    }) => {
                        // Find the new font's closest variant to the original
                        const {
                            style,
                            weight,
                            uuid
                        } = newFont.getClosestVariant({
                            weight: originalTypography.fontWeight,
                            isItalic: originalTypography.fontStyle === 'italic',
                        });

                        updateConfigurationPaths({
                                fontVariantUUID: uuid,
                                fontFamily: newFont.fontFamily,
                                fontStyle: style,
                                fontWeight: weight,
                                // Retain the original font size adjustment
                                fontSizeAdjustment: originalTypography.fontSizeAdjustment,
                            },
                            paths,
                        );
                    });
                }, [updateConfigurationPaths],
            );
        },
        // Hook returns a function which will reset the field's configuration value to the variant default
        useResetToDefaultConfigurationValue: () => {
            const {
                updateConfigurationPaths
            } = useEditorDispatch();

            return () => {
                fontOverrides.forEach((override) => {
                    updateConfigurationPaths(override.originalTypography, override.paths);
                });
            };
        },
    };
};

/**
 * Gets a rich image field with additional hooks for accessing the field's image url and modifications
 */
const getRichImageField = (imageField) => {
    const baseRichImageField = getBaseRichEditorField(imageField);

    const {
        width,
        height,
        paths
    } = baseRichImageField;

    // We actually want to strip out "content" from the image field so it represents the whole image layer,
    // this is part of the move to the 'LAYER_IMAGE' editing action from the 'IMAGE_ASSET' action. See: WaymarkAuthorConfigurator.configuratorWillSetup
    const newPaths = paths.map((path) => path.replace('.content', ''));
    // eslint-disable-next-line no-param-reassign
    imageField.paths = newPaths;

    // Hook returns the image field's current configuration value
    const {
        useCurrentConfigurationValue,
        useUpdateConfigurationValue
    } = baseRichImageField;

    // Hook parses the field's current configuration value and returns an image url
    const useCurrentImageURL = (shouldIncludeQueryParams = true) => {
        const [imageURL, setImageURL] = useState(null);

        const currentConfigurationValue = useCurrentConfigurationValue();
        let {
            content
        } = currentConfigurationValue;

        // Image overrides do not have a content object, just location, modifications, and type at the root level,
        // which maps to the content object in regular image fields.
        if (!content) {
            content = currentConfigurationValue;
        }

        useEffect(() => {
            const parseAndSetImageURL = async () => {
                const parsedImageURL = await getAssetUrl({
                    ...content,
                    w: width,
                    h: height,
                });

                setImageURL(
                    shouldIncludeQueryParams ? parsedImageURL : getURLWithoutQueryParams(parsedImageURL),
                );
            };

            parseAndSetImageURL();
        }, [content, shouldIncludeQueryParams]);

        return imageURL;
    };

    // Hook returns a function which will update the field's configuration value given a new image url string
    const useSetImageURL = () => {
        const updateConfigurationValue = useUpdateConfigurationValue();

        return useCallback(
            (newImageURL, shouldRetainModifications = false) => {
                // Format library image as asset object
                const {
                    path,
                    subDomain
                } = getURLParts(newImageURL);

                const location = {
                    plugin: 'waymark',
                    // Remove preceding slash
                    key: path.substring(1),
                };

                // Check if the image URL matches a subdomain in the Waymark location sources.
                const waymarkLocationSources = getWaymarkLocationSources();
                const sourceTypes = Object.keys(waymarkLocationSources);
                for (let i = 0; i < sourceTypes.length; i += 1) {
                    const sourceType = sourceTypes[i];
                    // Waymark location sources have keys for both aws and imgix domains.
                    // Images should only be accessed via an imgix domain.
                    if (subDomain === waymarkLocationSources[sourceType].imgix) {
                        location.type = sourceType;
                        break;
                    }
                }

                if (!location.type) {
                    throw new Error(`Missing source type for subdomain: ${subDomain}`);
                }

                updateConfigurationValue((currentConfigurationValue) => {
                    const currentFit =
                        _.get(
                            currentConfigurationValue,
                            `content.modifications.${ImageModificationKeys.fit}`,
                        ) || defaultImageFitFillMode;

                    const modifications =
                        shouldRetainModifications && currentConfigurationValue.content ? .modifications ?
                        currentConfigurationValue.content.modifications :
                        DefaultImageModifications[currentFit];

                    return {
                        ...currentConfigurationValue,
                        content: {
                            location,
                            type: 'image',
                            // Width and height are needed for URL parsing via the asset plugin
                            w: width,
                            h: height,
                            // Use default modifications for the current (or default) fit/fill mode
                            modifications,
                        },
                    };
                });
            }, [updateConfigurationValue],
        );
    };

    return {
        ...baseRichImageField,
        useCurrentImageURL,
        useSetImageURL,
        // Hook returns the image field's modification value(s) at a given modification path
        useCurrentImageModificationsValue: (modificationPath) => {
            const currentConfigurationValue = useCurrentConfigurationValue();

            return _.get(
                currentConfigurationValue,
                `content.modifications${
          modificationPath === ImageModificationKeys.all ? '' : `.${modificationPath}`
        }`,
                null,
            );
        },
        // Hook returns a function which will update the image field's modifications
        useUpdateImageModifications: () => {
            const updateConfigurationValue = useUpdateConfigurationValue();

            return useCallback(
                (newModificationValueOrFunction, modificationKey) => {
                    // Update the configuration value with our new modifications
                    updateConfigurationValue((currentConfigurationValue) => {
                        const isUpdatingAllModifications = modificationKey === ImageModificationKeys.all;

                        const newModificationValue =
                            typeof newModificationValueOrFunction === 'function' ? // If provided a function, call it with the current value for the given modification key
                            newModificationValueOrFunction(
                                _.get(
                                    currentConfigurationValue,
                                    `content.modifications${
                        isUpdatingAllModifications ? '' : `.${modificationKey}`
                      }`,
                                    null,
                                ),
                            ) :
                            _.cloneDeep(newModificationValueOrFunction);

                        // Clone the current configuration value so we can modify it
                        const newConfigurationValue = _.cloneDeep(currentConfigurationValue);

                        let validatedModifications;

                        if (isUpdatingAllModifications) {
                            // If the "all" modification was provided, we want to replace the entire modification object
                            validatedModifications = validateImageModifications(newModificationValue, imageField);
                        } else {
                            // Otherwise, let's only update a portion of the modifications object
                            const newModificationsObject =
                                _.get(newConfigurationValue, 'content.modifications') || {};
                            _.set(newModificationsObject, modificationKey, newModificationValue);

                            validatedModifications = validateImageModifications(
                                newModificationsObject,
                                imageField,
                            );
                        }

                        // Update the new configuration value with the newly validated modifications
                        _.set(
                            newConfigurationValue,
                            'content.modifications',
                            // If the validated modifications are just an empty object, store as null
                            _.isEmpty(validatedModifications) ? null : validatedModifications,
                        );

                        return newConfigurationValue;
                    });
                }, [updateConfigurationValue],
            );
        },

        // Hook returns a function which will update the image layer's properties
        useUpdateConfigurationLayerData: () => {
            const currentConfigurationValue = useCurrentConfigurationValue();
            const {
                updateConfigurationPaths
            } = useEditorDispatch();

            return useCallback(
                (layerDataKey, newLayerDataValue) => {
                    updateConfigurationPaths({
                            ...currentConfigurationValue,
                            [layerDataKey]: newLayerDataValue,
                        },
                        imageField.paths,
                    );
                }, [currentConfigurationValue, updateConfigurationPaths],
            );
        },
    };
};

/**
 * Gets a rich video field with additional hooks for accessing the field's modifications
 */
const getRichVideoField = (videoField) => {
    // Get a base rich editor field with standard useCurrentConfigurationValue and useUpdateConfigurationValue hooks
    const baseRichVideoField = getBaseRichEditorField(videoField);

    const {
        useCurrentConfigurationValue
    } = baseRichVideoField;

    /**
     * Hook takes an array of output type keys and returns the corresponding processed video asset data for this field's
     * currently selected video asset
     *
     * @param {string[]}  processedOutputTypeKeys   Array of keys for the data types you want from the asset's processed output
     *                                                ie, "webPlayer_h264", "tenThumbnails_jpg300", etc
     *
     * @returns {string[][]}  Returns an array of the location string arrays corresponding to each output type key
     */
    const useCurrentVideoAssetProcessedOutput = (processedOutputTypeKeys) => {
        const [isAssetVerified, setIsAssetVerified] = useState(false);

        const {
            content: {
                location: {
                    sourceVideo: videoAssetKey
                },
            },
        } = useCurrentConfigurationValue();

        useEffect(() => {
            // Every time the current video asset key changes, let's "verify" it to make sure we have the processed output data for
            // the asset before we try to access it
            setIsAssetVerified(false);

            const verifyAssetOutput = async () => {
                // Ensure that the asset we want to use has been fully processed and is ready to use
                await videoProcessingService.verifyProcessedOutput(videoAssetKey);

                setIsAssetVerified(true);
            };

            verifyAssetOutput();
        }, [videoAssetKey]);

        // Get the desired processed output data for the current verified video asset
        return processedOutputTypeKeys.map((typeKey) =>
            isAssetVerified ?
            videoProcessingService.describeProcessedOutput(videoAssetKey, typeKey).locations :
            [],
        );
    };

    /**
     * Hook loads and returns the best available video URL for the currently selected video asset
     *
     * @returns {string | null}
     */
    const useCurrentVideoAssetURL = () => {
        const {
            content: {
                location: {
                    sourceVideo: videoAssetKey
                },
            },
        } = useCurrentConfigurationValue();

        return useVideoAssetURL(videoAssetKey);
    };

    /**
     * Hook loads and returns an object describing metadata for the currently selected video asset
     *
     * @returns {VideoAssetMetadata}  An object with the video's width, height, and length
     */
    const useCurrentVideoAssetMetadata = () => {
        // Possible states:
        // - null: Video asset metadata has not been loaded yet
        // - { width, height, length }: Video asset metadata has been loaded

        const [videoAssetMetadata, setVideoAssetMetadata] = useState(null);

        const {
            content: {
                location: {
                    sourceVideo: videoAssetKey
                },
            },
        } = useCurrentConfigurationValue();

        useEffect(() => {
            setVideoAssetMetadata(null);

            let timeoutId = null;
            let isSubscribed = true;
            let metadataAttemptRetryCount = 6;
            const attemptSetMetadata = async () => {
                // Attempt to fetch the metadata
                try {
                    const loadedVideoAssetMetadata = await videoProcessingService.analyzeProcessedOutput(
                        videoAssetKey,
                        'master',
                    );
                    if (isSubscribed) {
                        // Only update state if this hook has been cleaned up before the promise resolved
                        setVideoAssetMetadata({
                            width: loadedVideoAssetMetadata.width,
                            height: loadedVideoAssetMetadata.height,
                            length: loadedVideoAssetMetadata.duration,
                        });
                    }
                    return;
                } catch {
                    // If the master metadata is not there, it's likely a shutterstock video that is still processing in the VPS.
                    // In that case, we should have a lower-quality raw_preview asset which we can attempt to use instead.
                    try {
                        // Manually constructing and attempting to fetch the metadata.json URL for the raw_preview asset
                        // because the VPS SDK's analyzeProcessedOutput method doesn't support raw_previews
                        const metadataURL = videoProcessingService
                            .describeProcessedOutput(videoAssetKey, 'webPlayer_h264')
                            .locations[0].replace('webPlayer_h264', 'raw_preview')
                            .replace('.mp4', '/metadata.json');

                        const rawPreviewMetadataResponse = await fetch(metadataURL, {
                            method: 'GET',
                        });

                        if (rawPreviewMetadataResponse.ok) {
                            const rawPreviewMetadata = await rawPreviewMetadataResponse.json();
                            if (isSubscribed) {
                                // Only update state if this hook has been cleaned up before the promise resolved
                                setVideoAssetMetadata({
                                    width: rawPreviewMetadata.width,
                                    height: rawPreviewMetadata.height,
                                    length: rawPreviewMetadata.duration,
                                });
                            }
                            return;
                        } else {
                            throw new Error(`Failed to fetch raw_preview metadata for ${videoAssetKey}`);
                        }
                    } catch (error) {
                        console.error(error);
                    }

                    // If we still haven't loaded the metadata, try again
                    if (metadataAttemptRetryCount > 0) {
                        timeoutId = setTimeout(
                            attemptSetMetadata,
                            // Back off so that we wait longer between each attempt
                            // First attempt will be 1666ms, second will be 2000ms, etc
                            10000 / metadataAttemptRetryCount,
                        );
                        metadataAttemptRetryCount -= 1;
                    }
                }
            };
            attemptSetMetadata();
            return () => {
                isSubscribed = false;
                clearTimeout(timeoutId);
            };
        }, [videoAssetKey]);

        return videoAssetMetadata;
    };

    /**
     * Returns the currently editing video field layer GUID, i.e. it omits configuration prefix 'waymarkVideo--',
     * which should be the current target for audio ducking configuration changes.
     */
    const getCurrentDuckingTargetGUID = () => videoField.paths[0].match(NESTED_GUID_REGEX_PATTERN)[0];

    /**
     * Reset both the video and audio configuration values to their original defaults for this video field
     */
    const useResetToDefaultConfigurationValue = () => {
        const {
            defaultConfiguration
        } = useEditorState();
        const {
            updateConfigurationPaths
        } = useEditorDispatch();

        const {
            setVolumeChangeForTarget
        } = useAudioControlsContext();

        const pauseVideoPlayback = usePauseVideoPlayback();
        const jumpVideoToTime = useJumpVideoToTime();

        return async () => {
            await pauseVideoPlayback();
            jumpVideoToTime(videoField.displayTime);

            const defaultVideoConfigurationValue = _.get(defaultConfiguration, videoField.paths[0]);
            updateConfigurationPaths(defaultVideoConfigurationValue, videoField.paths);

            const duckingTarget = getCurrentDuckingTargetGUID();

            // We have to reset the volume change for the ducking target to 1 for the renderer
            // to register the change
            setVolumeChangeForTarget(duckingTarget, 1);
        };
    };

    /**
     * Hook returns a function which will update the video field's entire base configuration object
     *
     * @returns {function}  updateVideoConfigurationValue
     */
    const useUpdateVideoConfigurationValue = () => {
        const pauseVideoPlayback = usePauseVideoPlayback();
        const jumpVideoToTime = useJumpVideoToTime();
        const updateConfigurationValue = baseRichVideoField.useUpdateConfigurationValue();

        /**
         * Function updates the video field's entire configuration object with a new value
         *
         * @param {Object|function} newValue  New value to set at the video field's base configuration paths. If
         *                                      a function is provided, it will be called with the video field's current
         *                                      configuration value and then the configuration will be updated with the resulting return value.
         */
        return useCallback(
            async (newValue) => {
                // Pause the video and jump to the video field's display time when a change is made.
                await pauseVideoPlayback();
                jumpVideoToTime(videoField.displayTime);

                updateConfigurationValue(newValue);
            }, [jumpVideoToTime, pauseVideoPlayback, updateConfigurationValue],
        );
    };

    /**
     * Hook returns a function which will update the video field's configuration at a given modification key path
     *
     * @returns {function}  updateVideoModification
     */
    const useUpdateVideoModification = () => {
        const updateVideoConfigurationValue = useUpdateVideoConfigurationValue();

        /**
         * Function updates the video field's configuration at a given modification key path with a new value
         *
         * @param {Object|function} newValue  New value to set at the modification key path. If a function is provided,
         *                                      it will be called with the current value in the configuration at that key
         *                                      and then the configuration will be updated with the resulting return value.
         * @param {string}  modificationKey   Configuration path key to update, relative to the base of the video fields's configuration object
         *                                      ie, 'contentTrimStart', 'contentZoom.z'
         */
        return useCallback(
            async (newModificationValue, modificationKey) =>
            updateVideoConfigurationValue((currentConfigurationValue) => {
                // Clone the current configuration value object so we don't directly modify it
                const newConfigurationValue = _.cloneDeep(currentConfigurationValue);

                const newModificationValueForConfiguration =
                    typeof newModificationValue === 'function' ? // If a function was passed in, call it with the current value configuration value at the given modification key
                    newModificationValue(_.get(currentConfigurationValue, modificationKey)) :
                    newModificationValue;

                // Apply the modification to the new configuration
                _.set(newConfigurationValue, modificationKey, newModificationValueForConfiguration);

                return newConfigurationValue;
            }), [updateVideoConfigurationValue],
        );
    };

    /**
     * Hook returns a function which will update the selected video asset for the video field
     *
     * @returns {function}  updateConfigurationVideoAsset
     */
    const useUpdateConfigurationVideoAsset = () => {
        const updateConfigurationValue = baseRichVideoField.useUpdateConfigurationValue();

        /**
         * Construct a new configuration value for the video field that updates
         * the selected video asset and resets all other modifications to their default
         *
         * @param {string} videoAssetKey: VideoProcessingService upload key.
         */
        return useCallback(
            (videoAssetKey) => {
                updateConfigurationValue((currentConfigurationValue) => ({
                    ...currentConfigurationValue,
                    content: {
                        location: {
                            plugin: videoAssetPluginType,
                            sourceVideo: videoAssetKey,
                        },
                        type: 'video',
                    },
                    // Preserve audio adjustments
                    volume: currentConfigurationValue.volume || 1,
                    isMuted: currentConfigurationValue.isMuted || false,
                    ...defaultVideoFitFillModeModifications[defaultVideoFitFillMode],
                    ...baseDefaultVideoModifications,
                }));
            }, [updateConfigurationValue],
        );
    };

    return {
        ...baseRichVideoField,
        getCurrentDuckingTargetGUID,
        useCurrentVideoAssetProcessedOutput,
        useCurrentVideoAssetURL,
        useCurrentVideoAssetMetadata,
        useResetToDefaultConfigurationValue,
        useUpdateVideoConfigurationValue,
        useUpdateVideoModification,
        useUpdateConfigurationVideoAsset,
    };
};

/**
 * Formats a rich audio field with custom functions to access and update configuration values
 */
const getRichAudioField = (audioField) => {
    const baseRichAudioField = getBaseRichEditorField(audioField);

    return {
        ...baseRichAudioField,
        /**
         * Not all audio layers are represented in the form description, so we need to provide
         * the paths to update and access explicitly rather than relying on the editor field
         */
        useCurrentConfigurationValue: (path) => useConfigurationValue(path),
        useUpdateConfigurationValue: () => {
            const {
                updateConfigurationPaths
            } = useEditorDispatch();

            return useCallback(
                (newValue, path) => {
                    updateConfigurationPaths(newValue, [path]);
                }, [updateConfigurationPaths],
            );
        },
        /**
         * Hook returns a function which resets the selected background audio track to the variant default
         */
        useResetBackgroundAudioToDefault: () => {
            // This is the default background audio asset
            const defaultConfigurationValue = baseRichAudioField.useDefaultConfigurationValue();
            const updateConfigurationValue = baseRichAudioField.useUpdateConfigurationValue();

            return useCallback(() => {
                updateConfigurationValue(
                    defaultConfigurationValue,
                    editorAudioConfigurationPaths.backgroundAudio,
                );
            }, [defaultConfigurationValue, updateConfigurationValue]);
        },
        /**
         * Hook returns a function which clears any selected VO audio track and resets the background track's volume to 100%
         */
        useResetAuxiliaryAudioToDefault: () => {
            const {
                setFullConfiguration
            } = useEditorDispatch();

            const {
                mainAudioVolumePath,
                masterVolumeChanges
            } = useAudioControlsContext();

            return useCallback(
                () =>
                setFullConfiguration((currentConfiguration) => {
                    // Clone the existing configuration
                    const newConfiguration = { ...currentConfiguration
                    };

                    // Remove any uploaded audio
                    delete newConfiguration[editorAudioConfigurationPaths.auxiliaryAudio];

                    // Reset the volume --> volume is at 100% and not muted, but volume changes for audio
                    // clips are still respected
                    _.set(newConfiguration, mainAudioVolumePath, {
                        // Reset the volume - we need to explicitly set the volume to 1 and isMuted to false
                        // to override any previous settings otherwise the renderer will continue to play
                        // the audio with the old values
                        volume: 1,
                        isMuted: false,
                        // Since we are resettting the main volume, we can apply the master volume changes
                        volumeChanges: masterVolumeChanges,
                    });

                    return newConfiguration;
                }), [mainAudioVolumePath, masterVolumeChanges, setFullConfiguration],
            );
        },
    };
};

/**
 * Takes an EditorMainField and formats it into a rich field based on its type
 */
const getRichMainEditorField = (mainField) => {
    switch (mainField.type) {
        case VideoEditingFieldTypes.text:
        case VideoEditingFieldTypes.textSelector:
            return getBaseRichEditorField(mainField);
        case VideoEditingFieldTypes.image:
            return getRichImageField(mainField);
        case VideoEditingFieldTypes.video:
            return getRichVideoField(mainField);
        case VideoEditingFieldTypes.layoutSelector:
            {
                // Not breaking this out into a separate function because we need to be able to recursively call `getFormattedMainField`
                const baseRichLayoutSelector = getBaseRichEditorField(mainField);

                return {
                    ...baseRichLayoutSelector,
                    selectOptions: baseRichLayoutSelector.selectOptions.map((selectOption) => ({
                        ...selectOption,
                        // Recursively format all content fields as rich editor fields
                        contentFields: selectOption.contentFields.map(getRichMainEditorField),
                    })),
                };
            }
        default:
            throw new Error(`Main field of type "${mainField.type}" not supported`);
    }
};

/**
 * Takes the editor's form description and generates a "rich" form description
 * whose fields have various useful hooks attached which provide a nice interface for accessing or
 * modifying a field's configuration value
 *
 * @param {object} formDescription
 */
const getRichFormDescription = (formDescription) => {
    if (!formDescription) return null;

    const {
        audioField,
        colorFields,
        fontField,
        mainFields,
        ...otherFields
    } = formDescription;

    if (!_.isEmpty(otherFields)) {
        throw new Error(
            `Unexpected field(s) found in form description:\n${JSON.stringify(
        otherFields,
      )}\nThis either means that developer support needs to be added for this field type or the form description was misconfigured.`,
        );
    }

    const richFormDescription = {};

    if (audioField) {
        richFormDescription.audioField = getRichAudioField(formDescription.audioField);
    }
    if (colorFields) {
        richFormDescription.colorFields = formDescription.colorFields.map(getBaseRichEditorField);
    }
    if (fontField) {
        richFormDescription.fontField = getRichFontField(formDescription.fontField);
    }
    if (mainFields) {
        richFormDescription.mainFields = formDescription.mainFields.map(getRichMainEditorField);
    }

    return richFormDescription;
};

const EditorFormDescriptionContext = createContext();

export const useEditorFormDescriptionContext = () => useContext(EditorFormDescriptionContext);

/**
 * Provides the editor with access to the editor form description for the video
 *
 * @param {object}  [overrideFormDescription]   Optional form description object can be used instead of attempting to fetch one with the
 *                                                bundle manager.
 *                                                NOTE: THIS SHOULD ONLY USED IN UNIT TESTS AND THE STUDIO PREVIEW EDITOR, NEVER IN ANYTHING CUSTOMER-FACING
 */
export default function EditorFormDescriptionProvider({
    overrideFormDescription = null,
    overrideTemplateManifest = null,
    children,
}) {
    const [formDescription, setFormDescription] = useState(null);
    const [templateManifest, setTemplateManifest] = useState(null);
    const [isFormDescriptionLoading, setIsFormDescriptionLoading] = useState(true);
    const [formDescriptionError, setFormDescriptionError] = useState(null);

    const {
        editorVariant
    } = useEditorVideoContext();

    useEffect(() => {
        if (!editorVariant) return;

        const loadFormDescription = async () => {
            setIsFormDescriptionLoading(true);

            try {
                const {
                    videoTemplateSlug
                } = editorVariant;

                let formattedFormDescription;
                let rawTemplateManifest;

                if (overrideFormDescription) {
                    formattedFormDescription = overrideFormDescription;
                    rawTemplateManifest = overrideTemplateManifest;
                } else {
                    const isWaymarkAuthorTemplate =
                        WaymarkAuthorBundleManager.isWaymarkAuthorTemplate(videoTemplateSlug);

                    const bundleData = await WaymarkAuthorBundleManager.getBundleData(videoTemplateSlug);

                    const rawFormDescription =
                        // If this template is a Waymark Author Template, retrieve the form description from its
                        // data bundle
                        isWaymarkAuthorTemplate ?
                        bundleData.__cachedEditingForm : // Otherwise if a CreateJS template is being loaded, fake an editor
                        // form description so that EditorControlPanel will load.
                        {
                            editingFormFields: []
                        };

                    rawTemplateManifest = bundleData.templateManifest;

                    // If we're faking it for a CreateJS template, we don't need to validate the form description.
                    const shouldRequireValidFormDescription = isWaymarkAuthorTemplate;
                    formattedFormDescription = formatEditorFormDescription(
                        rawFormDescription,
                        shouldRequireValidFormDescription,
                    );
                }

                editorEventEmitter.emit('loadedFormDescription', formattedFormDescription);

                const richFormDescription = getRichFormDescription(formattedFormDescription);

                if (!richFormDescription) {
                    // If formatEditorFormDescription didn't return anything, we either didn't get a form description or
                    // it was invalid, so throw an error
                    throw new Error(`Failed to load form description for template slug ${videoTemplateSlug}`);
                }

                // Store our freshly loaded and formatted form description
                setFormDescription(richFormDescription);
                setTemplateManifest(rawTemplateManifest);
            } catch (error) {
                console.error(error);
                // If an error occurred while retrieving or formatting the form description,
                // update to reflect that an error occurred so we can show an error state
                setFormDescriptionError(error);
            }

            // Regardless of if the form description load succeeded or failed, mark that it is done
            setIsFormDescriptionLoading(false);
        };

        loadFormDescription();
        // We only need to reload the form description if the template changes
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editorVariant.videoTemplateSlug]);

    const contextValue = useMemo(
        () => ({
            formDescription,
            templateManifest,
            isFormDescriptionLoading,
            formDescriptionError,
        }), [formDescription, templateManifest, formDescriptionError, isFormDescriptionLoading],
    );

    return ( <
        EditorFormDescriptionContext.Provider value = {
            contextValue
        } > {
            children
        } <
        /EditorFormDescriptionContext.Provider>
    );
}
EditorFormDescriptionProvider.propTypes = {
    overrideFormDescription: PropTypes.shape({
        // eslint-disable-next-line react/forbid-prop-types
        editingFormFields: PropTypes.arrayOf(PropTypes.object),
    }),
    children: sharedPropTypes.children.isRequired,
};

const FORM_DESCRIPTION_TYPE_FIELD_KEYS = {
    [VideoEditingFieldTypes.audio]: 'audioField',
    [VideoEditingFieldTypes.color]: 'colorFields',
    [VideoEditingFieldTypes.font]: 'fontField',
    [VideoEditingFieldTypes.main]: 'mainFields',
};

/**
 * Returns the editor form description field(s) for a given field type
 *
 * @param {string} editorFieldType - The type of the field(s) to return
 */
export const useEditorFieldsOfType = (editorFieldType) => {
    const {
        formDescription,
        templateManifest
    } = useEditorFormDescriptionContext();
    if (!formDescription) return null;

    const formDescriptionFieldKey = FORM_DESCRIPTION_TYPE_FIELD_KEYS[editorFieldType];

    if (!formDescriptionFieldKey) {
        throw new Error(`Unsupported type "${editorFieldType}" provided to useEditorFieldsOfType hook`);
    }

    let fields = formDescription[formDescriptionFieldKey];

    if (formDescriptionFieldKey === FORM_DESCRIPTION_TYPE_FIELD_KEYS[VideoEditingFieldTypes.color]) {
        fields = fields.map((field) => {
            field.templateManifestEntry = templateManifest.overrides.find(
                (override) => override.id === field.editingFieldKey,
            );
            return field;
        });
    }

    return fields;
};