// Vendor
import {
    useEffect,
    useMemo,
    useState,
    useRef
} from 'react';
import _ from 'lodash';

// Editor
import {
    useEditorFieldsOfType
} from 'editor/providers/EditorFormDescriptionProvider.js';
import {
    VideoEditingFieldTypes
} from 'editor/constants/Editor';
import {
    useEditorPanelState
} from 'editor/providers/EditorPanelProvider';
import {
    useEditorState
} from 'editor/providers/EditorStateProvider.js';
import {
    getAssetUrl
} from 'shared/WaymarkAuthorWebRenderer.js';

// Shared
import {
    getURLWithoutQueryParams
} from 'shared/utils/urls.js';

/**
 * Returns an array of image URLs for all image fields
 *
 * @param {boolean} shouldIncludeQueryParams - Whether the returned image urls should have their query params stripped
 *
 * @returns {string[]}  Array of parsed image URLs
 */
export const useAllEditorImageFieldURLs = (shouldIncludeQueryParams = true) => {
    const [imageURLs, setImageURLs] = useState([]);

    const mainFields = useEditorFieldsOfType(VideoEditingFieldTypes.main);
    const {
        configuration
    } = useEditorState();

    // Extract the configuration values and dimensions for all image fields
    const imageFieldsConfigurationInfo = useMemo(
        () =>
        mainFields.reduce((configurationValues, field) => {
            if (field.type === VideoEditingFieldTypes.image) {
                const fieldConfigurationValue = _.get(configuration, field.paths[0]);
                configurationValues.push({
                    configurationValue: fieldConfigurationValue,
                    width: field.width,
                    height: field.height,
                });
            } else if (field.type === VideoEditingFieldTypes.layoutSelector) {
                // If this field is a layout selector, let's check if it has any nested image fields in its selected layout
                // that we need to include
                const fieldConfigurationValue = _.get(configuration, field.paths[0]);

                const selectedLayoutOption =
                    field.selectOptions.find(
                        (option) => option.configurationValue === fieldConfigurationValue,
                    ) || field.selectOptions[0];

                selectedLayoutOption.contentFields.forEach((layoutField) => {
                    const layoutFieldConfigurationValue = _.get(configuration, layoutField.paths[0]);

                    if (layoutField.type === VideoEditingFieldTypes.image) {
                        configurationValues.push({
                            configurationValue: layoutFieldConfigurationValue,
                            width: layoutField.width,
                            height: layoutField.height,
                        });
                    }
                });
            }

            return configurationValues;
        }, []), [mainFields, configuration],
    );

    const previousImageFieldsConfigurationInfo = useRef();

    useEffect(() => {
        if (_.isEqual(previousImageFieldsConfigurationInfo.current, imageFieldsConfigurationInfo)) {
            return;
        }

        previousImageFieldsConfigurationInfo.current = imageFieldsConfigurationInfo;

        (async function parseAndSetImageURLs() {
            const parsedImageURLs = await Promise.all(
                imageFieldsConfigurationInfo.map(async ({
                    configurationValue,
                    width,
                    height
                }) => {
                    // Newer templates store image asset data in a `content` object, but older ones have it
                    // directly on the root of configuration value.
                    const imageAssetContent = configurationValue.content || configurationValue;

                    const parsedImageURL = await getAssetUrl({
                        w: width,
                        h: height,
                        ...imageAssetContent,
                    });

                    return shouldIncludeQueryParams ?
                        parsedImageURL :
                        getURLWithoutQueryParams(parsedImageURL);
                }),
            );

            setImageURLs(parsedImageURLs);
        })();
    }, [imageFieldsConfigurationInfo, shouldIncludeQueryParams]);

    return imageURLs;
};

/**
 * Finds and returns the image field currently selected for editing based on the panel mode context
 *
 * @returns {EditorImageField}  The image field currently selected for editing
 */
export const useSelectedEditorImageField = () => {
    const mainFields = useEditorFieldsOfType(VideoEditingFieldTypes.main);

    // Get the panel context - this will be set when the user clicks to open an image field in the image control panel
    const {
        currentPanel: {
            sharedContext
        },
    } = useEditorPanelState();

    const selectedImageFieldKey = sharedContext ? .selectedImageFieldKey;

    if (selectedImageFieldKey) {
        for (let i = 0, numMainFields = mainFields.length; i < numMainFields; i += 1) {
            const field = mainFields[i];

            if (field.editingFieldKey === selectedImageFieldKey) {
                return field;
            }
            if (field.type === VideoEditingFieldTypes.layoutSelector) {
                for (
                    let j = 0, numSelectOptions = field.selectOptions.length; j < numSelectOptions; j += 1
                ) {
                    const selectOption = field.selectOptions[j];

                    const matchingLayoutField = selectOption.contentFields.find(
                        ({
                            editingFieldKey
                        }) => editingFieldKey === selectedImageFieldKey,
                    );

                    if (matchingLayoutField) {
                        return matchingLayoutField;
                    }
                }
            }
        }
    }

    return null;
};