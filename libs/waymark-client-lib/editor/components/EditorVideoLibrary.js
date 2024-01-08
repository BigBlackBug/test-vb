// Vendor
import _ from 'lodash';
import {
    useEffect,
    useMemo
} from 'react';
import PropTypes from 'prop-types';

// Editor
import VideoLibraryPanel from 'editor/components/VideoLibraryPanel.js';
import editorPropTypes from 'editor/constants/editorPropTypes.js';
import {
    VideoEditingFieldTypes
} from 'editor/constants/Editor';
import {
    useEditorMediaLibraries
} from 'editor/providers/EditorMediaLibrariesProvider.js';
import {
    useEditorState
} from 'editor/providers/EditorStateProvider.js';
import {
    useEditorFieldsOfType
} from 'editor/providers/EditorFormDescriptionProvider.js';
import {
    mediaLibrarySlugs
} from 'editor/constants/mediaLibraries.js';
import {
    getSectionsWithRemovedAssets
} from 'editor/utils/mediaLibraries.js';
import {
    configureVideoLibrarySections
} from 'editor/utils/videoLibraries.js';

/**
 * Renders collapsible sections for all video libraries used to edit template footage.
 * This component currently displays the following library types:
 * - Currently selected uploads and stock footage
 * - Account uploads and stock footage
 * - Account group footage libraries
 */
export default function EditorVideoLibrary({
    currentlyEditingVideoField,
    onOpenEditTab
}) {
    const {
        video: {
            onOpenTemplateFootagePanel,
            staticVideoLibraries,
            videoAssets
        },
    } = useEditorMediaLibraries();

    const {
        configuration,
        appliedBusinessDetails,
        accountName
    } = useEditorState();

    const {
        useCurrentConfigurationValue,
        useUpdateConfigurationVideoAsset
    } =
    currentlyEditingVideoField;

    const currentConfigurationValue = useCurrentConfigurationValue();
    const selectedVideoAssetKey = useMemo(
        () => currentConfigurationValue ? .content.location.sourceVideo, [currentConfigurationValue ? .content.location.sourceVideo],
    );

    const updateConfigurationVideoAsset = useUpdateConfigurationVideoAsset();

    const mainFields = useEditorFieldsOfType(VideoEditingFieldTypes.main);

    useEffect(() => {
        onOpenTemplateFootagePanel();
    }, [onOpenTemplateFootagePanel]);

    const configurationVideoUploadKeys = useMemo(() => {
        // Loop through the editing form and get the configuration value for any video editing fields,
        // and reduce the configuration value down to location key (video processing service upload key).
        return mainFields.reduce((uploadKeys, field) => {
            if (field.type === VideoEditingFieldTypes.video) {
                const configurationValue = _.get(configuration, field.paths[0]);
                uploadKeys.push(configurationValue.content.location.sourceVideo);
            } else if (field.type === VideoEditingFieldTypes.layoutSelector) {
                // If this field is a layout selector, let's check if it has any nested video fields.
                const configurationValue = _.get(configuration, field.paths[0]);

                const selectedLayoutOption =
                    field.selectOptions.find((option) => option.configurationValue === configurationValue) ||
                    field.selectOptions[0];

                selectedLayoutOption.contentFields.forEach((layoutField) => {
                    const layoutConfigurationValue = _.get(configuration, layoutField.paths[0]);

                    if (layoutField.type === VideoEditingFieldTypes.video) {
                        uploadKeys.push(layoutConfigurationValue.content.location.sourceVideo);
                    }
                });
            }

            return uploadKeys;
        }, []);
    }, [configuration, mainFields]);

    /**
     * Select and use a video asset from the library for the current video field.
     *
     * @param {string} newVideoAssetKey: VideoProcessingService upload key.
     */
    const selectVideoAsset = (newVideoAssetKey) => updateConfigurationVideoAsset(newVideoAssetKey);

    // Library sections:
    // 1. Account selected business uploads and stock assets (if account has
    // selected business).
    // 2. Account uploads and stock assets
    const videoLibrarySectionConfigs = useMemo(() => {
        // Display the business library with or without assets if there is a
        // selected business
        const shouldDisplayBusinessLibrary = Boolean(appliedBusinessDetails);

        return [{
                slug: mediaLibrarySlugs.businessAll,
                ownerName: appliedBusinessDetails ? .businessName,
                shouldDisplayEmpty: shouldDisplayBusinessLibrary,
                canUpload: true,
                isInitiallyExpanded: true,
            },
            {
                slug: mediaLibrarySlugs.accountAll,
                ownerName: accountName,
                shouldDisplayEmpty: !shouldDisplayBusinessLibrary,
                canUpload: !shouldDisplayBusinessLibrary,
                isInitiallyExpanded: !shouldDisplayBusinessLibrary,
            },
        ];
    }, [accountName, appliedBusinessDetails]);

    // Get configured VideoLibrary objects
    const {
        activeSections,
        removedSections
    } = useMemo(
        () => ({
            activeSections: configureVideoLibrarySections(videoAssets, videoLibrarySectionConfigs),
            // Track which of the sections have removed assets so we know to display the
            // button to open the restoration panel
            removedSections: getSectionsWithRemovedAssets(videoAssets, videoLibrarySectionConfigs),
        }), [videoAssets, videoLibrarySectionConfigs],
    );

    return ( <
        VideoLibraryPanel librarySections = {
            [...activeSections, ...staticVideoLibraries]
        }
        onClickLibraryVideo = {
            ({
                uploadKey
            }) => {
                if (uploadKey === selectedVideoAssetKey) {
                    onOpenEditTab();
                } else {
                    selectVideoAsset(uploadKey);
                }
            }
        }
        selectVideoAsset = {
            selectVideoAsset
        }
        selectedVideoAssetKey = {
            selectedVideoAssetKey
        }
        configurationVideoUploadKeys = {
            configurationVideoUploadKeys
        }
        removedLibrarySections = {
            removedSections
        }
        onAddStockAssetToLibrary = {
            updateConfigurationVideoAsset
        }
        />
    );
}

EditorVideoLibrary.propTypes = {
    currentlyEditingVideoField: editorPropTypes.editorVideoField.isRequired,
    onOpenEditTab: PropTypes.func.isRequired,
};