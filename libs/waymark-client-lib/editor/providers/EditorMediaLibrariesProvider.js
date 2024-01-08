// Vendor
import _ from 'lodash';
import {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState
} from 'react';

// Editor
import {
    useEditorVideoContext
} from 'editor/providers/EditorVideoProvider.js';
import {
    useEditorFieldsOfType
} from 'editor/providers/EditorFormDescriptionProvider.js';
import {
    defaultAudioCloudfrontURI,
    waymarkAuthorPreviewSlug,
    VideoEditingFieldTypes,
    WAYMARK_AUTHOR_PREVIEW_SLUG,
} from 'editor/constants/Editor';
import {
    getWaymarkAudioConfigurationValue
} from 'editor/utils/editorForm.js';
import editorPropTypes from 'editor/constants/editorPropTypes.js';
import {
    createStaticVideoAssets
} from 'editor/utils/videoLibraries.js';
import {
    createUserEditorAssets
} from 'editor/utils/mediaLibraries.js';
import {
    assetOwnerTypes,
    mediaTypes
} from 'editor/constants/mediaLibraries.js';

// Shared
import {
    fetchVideoTemplateVariantAudio
} from 'shared/api/index.js';
import sharedPropTypes from 'shared/components/propTypes/index.js';

const EditorMediaLibrariesContext = createContext();

export const useEditorMediaLibraries = () => useContext(EditorMediaLibrariesContext);

const formatAudioAssets = (audioAssets, isWaymarkAuthorPreview) =>
    audioAssets.map((asset) => {
        if (isWaymarkAuthorPreview) {
            return {
                waymarkAudioAsset: asset.configurationValue,
                assetKey: asset.configurationValue.location.id,
                displayName: asset.label,
                currentAssetLocation: 'location',
                isDynamicAssetType: false,
                previewURL: null,
            };
        }

        // Audio options configured in the Studio will already have a configuration value, but
        // global audio options and variant audio overrides will not yet.
        const waymarkAudioAsset = asset.configurationValue ?
            asset.configurationValue :
            getWaymarkAudioConfigurationValue(asset.audio_path);

        return {
            // Construct a preview URL and ensure we have the correctly formatted audio asset.
            waymarkAudioAsset,
            assetKey: waymarkAudioAsset.location.key,
            displayName: asset.label || asset.display_name,
            currentAssetLocation: 'location',
            isDynamicAssetType: false,

            // Variant audio overrides and global audio options have an audio URL
            // stored on them, but audio configured in the Studio will not.
            previewURL: asset.audio_url ?
                asset.audio_url :
                `${defaultAudioCloudfrontURI}${asset.configurationValue.location.key}`,
        };
    });

/**
 * Provides the editor with access to the image, color, audio, and font libraries
 */
export default function EditorMediaLibrariesProvider({
    editorMediaLibraries,
    children
}) {
    const {
        editorVariant
    } = useEditorVideoContext();
    const [variantAudio, setVariantAudio] = useState([]);

    const {
        audio: {
            globalAudio: {
                globalAudioLibraries,
                isFetchingGlobalAudio,
                loadGlobalAudio
            },
        },
        video: {
            accountVideoAssets,
            businessVideoAssets,
            staticVideoLibraries
        },
    } = editorMediaLibraries;

    // Convert raw video asset data into VideoAsset instances for uniform structure
    const videoAssets = useMemo(
        () =>
        createUserEditorAssets(mediaTypes.footage, {
            [assetOwnerTypes.account]: accountVideoAssets,
            [assetOwnerTypes.business]: businessVideoAssets,
        }), [accountVideoAssets, businessVideoAssets],
    );
    // Convert all static video assets into StaticVideoAsset instances for uniform structure
    const mappedStaticVideoLibraries = useMemo(
        () => createStaticVideoAssets(staticVideoLibraries), [staticVideoLibraries],
    );

    const variantSlug = editorVariant ? editorVariant.slug : null;

    const isWaymarkAuthorPreview = variantSlug === waymarkAuthorPreviewSlug;

    useEffect(() => {
        const loadVariantAudio = async () => {
            try {
                const variantAudioAssets = await fetchVideoTemplateVariantAudio(variantSlug);
                setVariantAudio(variantAudioAssets);
            } catch (e) {
                console.error('Error fetching variant audio: ', e);
            }
        };

        if (variantSlug && variantSlug !== WAYMARK_AUTHOR_PREVIEW_SLUG) {
            loadVariantAudio();
        }
    }, [variantSlug]);

    useEffect(() => {
        // We don't need to load global audio if:
        // 1. It is currently being fetched
        // 2. There is no editorVariant yet or that variant does not include global audio
        // 3. We have already loaded global audio
        if (
            isFetchingGlobalAudio ||
            !editorVariant ||
            !editorVariant.shouldIncludeGlobalAudio ||
            !_.isEmpty(globalAudioLibraries)
        ) {
            return;
        }

        loadGlobalAudio();
    }, [editorVariant, globalAudioLibraries, isFetchingGlobalAudio, loadGlobalAudio]);

    // Derive our variant audio library from the editor variant and audio field; all other media libraries are composed externally
    const variantAudioLibrary = useMemo(() => {
        const formattedVariantAudio = formatAudioAssets(variantAudio, isWaymarkAuthorPreview);

        return formattedVariantAudio;
    }, [isWaymarkAuthorPreview, variantAudio]);

    const globalAudioLibrariesForDuration = useMemo(() => {
        if (!editorVariant.shouldIncludeGlobalAudio) {
            return [];
        }

        return globalAudioLibraries.reduce((formattedGlobalAudioLibraries, library) => {
            const audioAssetsForDuration = library.audio.filter(
                (asset) => asset.length === editorVariant.displayDuration,
            );

            if (audioAssetsForDuration.length) {
                formattedGlobalAudioLibraries.push({
                    slug: library.slug,
                    displayName: library.display_name,
                    audio: formatAudioAssets(audioAssetsForDuration, isWaymarkAuthorPreview),
                });
            }

            return formattedGlobalAudioLibraries;
        }, []);
    }, [
        editorVariant.displayDuration,
        editorVariant.shouldIncludeGlobalAudio,
        globalAudioLibraries,
        isWaymarkAuthorPreview,
    ]);

    const contextValue = useMemo(
        () => ({
            ...editorMediaLibraries,
            audio: {
                ...editorMediaLibraries.audio,
                variantAudio: variantAudioLibrary,
                globalAudio: globalAudioLibrariesForDuration,
            },
            video: {
                ...editorMediaLibraries.video,
                videoAssets,
                staticVideoLibraries: mappedStaticVideoLibraries,
            },
        }), [
            editorMediaLibraries,
            globalAudioLibrariesForDuration,
            mappedStaticVideoLibraries,
            variantAudioLibrary,
            videoAssets,
        ],
    );

    return ( <
        EditorMediaLibrariesContext.Provider value = {
            contextValue
        } > {
            children
        } <
        /EditorMediaLibrariesContext.Provider>
    );
}
EditorMediaLibrariesProvider.propTypes = {
    editorMediaLibraries: editorPropTypes.editorMediaLibraries.isRequired,
    children: sharedPropTypes.children.isRequired,
};