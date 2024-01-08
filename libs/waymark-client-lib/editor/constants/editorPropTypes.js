import PropTypes from 'prop-types';

// Editor
import {
    VideoEditingFieldTypes
} from 'editor/constants/Editor';
import {
    waymarkAPSPluginType
} from 'editor/constants/EditorAudio.js';

import AccountImageLibrary from 'app/models/imageLibraries/AccountImageLibrary';
import BusinessImageLibrary from 'app/models/imageLibraries/BusinessImageLibrary';
import StaticImageLibrary from 'app/models/imageLibraries/StaticImageLibrary';
import ImageAsset from 'app/models/imageLibraries/ImageAsset';
import VideoLibrary from 'app/models/VideoLibrary.js';

// Shared
import {
    ValidationCheck,
    getCustomPropValidator
} from 'shared/utils/customPropValidator.js';

/**
 * Describes the place and way to download an asset for a Waymark Author Web Renderer Asset
 *
 * @typedef {object}  WaymarkAuthorAssetLocation
 * @property  {string}  plugin
 * @property  {string}  [type]
 * @property  {string}  [key]
 * @property  {string}  [id]
 */
const waymarkAuthorAssetLocation = PropTypes.shape({
    plugin: PropTypes.string.isRequired,
    type: PropTypes.string,
    key: PropTypes.string,
    id: PropTypes.string,
});

/**
 * Describes the type and location of an asset for a Waymark Author Web Renderer Asset
 *
 * @typedef {object}  WaymarkAuthorAsset
 * @property  {WaymarkAuthorAssetLocation}  location
 * @property  {string}  type
 * @property  {object}  [modifications]
 */
const waymarkAuthorAsset = PropTypes.shape({
    location: waymarkAuthorAssetLocation.isRequired,
    type: PropTypes.string.isRequired,
    modifications: PropTypes.object,
});

// Base shape that all editor fields will follow; some fields may have additional special properies as well
/**
 * @typedef {object}  BaseEditorField
 * @property  {string}    editingFieldKey - Unique id for this field
 * @property  {number}    displayTime - Timestamp in seconds where this field is visible in the video
 *                                        Note that this does not necessarily mean precisely where the field first appears; it is simply
 *                                        a semi-arbitrary time that we can jump the video to so the user will be able to nicely see their changes
 *                                        taking effect.
 * @property  {string}    type - The editor field's type, ie 'image', 'text'
 * @property  {string}    label - Label describing the editor field
 * @property  {func}      useCurrentConfigurationValue - Hook returns the field's current configuration value
 * @property  {func}      useUpdateConfigurationValue - Hook returns a function that updates the field's configuration value
 * @property  {func}      useResetToDefaultConfigurationValue - Hook returns a function that resets the field's configuration value to the variant default
 */
const baseEditorFieldShape = {
    editingFieldKey: PropTypes.string.isRequired,
    displayTime: PropTypes.number,
    type: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    useCurrentConfigurationValue: PropTypes.func.isRequired,
    useUpdateConfigurationValue: PropTypes.func.isRequired,
    useResetToDefaultConfigurationValue: PropTypes.func.isRequired,
};

/**
 * @typedef {object}  TextFieldProperties
 * @property  {number}   [characterLimit] - Max number of characters that can be stored for this field
 *
 * @typedef {BaseEditorField & TextFieldProperties} EditorTextField
 */
const editorTextField = PropTypes.shape({
    ...baseEditorFieldShape,
    type: getCustomPropValidator('string', true, [
        // Ensure that this field has type "text"
        new ValidationCheck(
            (props, propName) => props[propName] === VideoEditingFieldTypes.text,
            `expected prop "type" to be "${VideoEditingFieldTypes.text}"`,
        ),
    ]),
    characterLimit: PropTypes.number,
});

/**
 * @typedef {object}  TextSelectorOption
 * @property  {string}  configurationValue
 * @property  {string}  label
 *
 * @typedef {object}  TextSelectorProperties
 * @property  {TextSelectorOption[]}  selectOptions - Options for this field's value that can be selected from a dropdown
 *
 * @typedef {BaseEditorField & TextSelectorProperties} EditorTextSelectorField
 */
const editorTextSelectorField = PropTypes.shape({
    ...baseEditorFieldShape,
    type: getCustomPropValidator('string', true, [
        // Ensure that this field has type "text"
        new ValidationCheck(
            (props, propName) => props[propName] === VideoEditingFieldTypes.textSelector,
            `expected prop "type" to be "${VideoEditingFieldTypes.textSelector}"`,
        ),
    ]),

    selectOptions: PropTypes.arrayOf(
        PropTypes.shape({
            configurationValue: PropTypes.string.isRequired,
            label: PropTypes.string.isRequired,
        }),
    ),
});

/**
 * @typedef {object}  ImageFieldProperties
 * @property  {number}  width - The width of the image field
 * @property  {number}  height - The height of the image field
 * @property  {func}    useCurrentImageURL - Hook parses and returns a URL string from the image field's current configuration value
 * @property  {func}    useSetImageURL - Hook returns a function that will update the image field's configuration value
 *                                            given an image URL string
 * @property  {func}    useCurrentImageModificationsValue - Hook returns the image field's modifications value at a given path
 * @property  {func}    useUpdateImageModifications - Hook returns a function which updates the image field's modifications
 *
 * @typedef {BaseEditorField & ImageFieldProperties} EditorImageField
 */
const editorImageField = PropTypes.shape({
    ...baseEditorFieldShape,
    type: getCustomPropValidator('string', true, [
        // Ensure that this field has type "image"
        new ValidationCheck(
            (props, propName) => props[propName] === VideoEditingFieldTypes.image,
            `expected prop "type" to be "${VideoEditingFieldTypes.image}"`,
        ),
    ]),
    width: PropTypes.number,
    height: PropTypes.number,
    useCurrentImageURL: PropTypes.func.isRequired,
    useSetImageURL: PropTypes.func.isRequired,
    useCurrentImageModificationsValue: PropTypes.func.isRequired,
    useUpdateImageModifications: PropTypes.func.isRequired,
});

/**
 * @typedef {object}    VideoFieldProperties
 * TODO video upload: fill this out when we know what the API looks like
 *
 * @typedef {BaseEditorField & VideoFieldProperties} EditorVideoField
 */
const editorVideoField = PropTypes.shape({
    ...baseEditorFieldShape,
    type: getCustomPropValidator('string', true, [
        // Ensure that this field has type "video"
        new ValidationCheck(
            (props, propName) => props[propName] === VideoEditingFieldTypes.video,
            `expected prop "type" to be "${VideoEditingFieldTypes.video}"`,
        ),
    ]),
    useCurrentVideoAssetProcessedOutput: PropTypes.func.isRequired,
    useCurrentVideoAssetMetadata: PropTypes.func.isRequired,
    useResetToDefaultConfigurationValue: PropTypes.func.isRequired,
    useUpdateVideoConfigurationValue: PropTypes.func.isRequired,
});

/**
 * An inlined editor field (a field that can appear inside a layout selector) can be a text, text selector, or image field
 * @typedef {(EditorTextField|EditorTextSelectorField|EditorImageField)}  EditorMainInlineField
 */
const editorMainInlineField = PropTypes.oneOfType([
    editorTextField,
    editorTextSelectorField,
    editorImageField,
    editorVideoField,
]);

/**
 * @typedef {object}  LayoutSelectorOption
 * @property  {string}  label
 * @property  {string|boolean|number} configurationValue
 * @property  {EditorMainInlineField[]} contentFields - Content fields to start using and displaying in the form when this option is selected
 *
 * @typedef {object}  LayoutSelectorProperties
 * @property  {LayoutSelectorOption[]}  selectOptions - Options for this field's value that can be selected from a dropdown
 *
 * @typedef {BaseEditorField & LayoutSelectorProperties}  EditorLayoutSelectorField
 */
const editorLayoutSelectorField = PropTypes.shape({
    ...baseEditorFieldShape,
    type: getCustomPropValidator('string', true, [
        // Ensure that this field has type "layout_selector"
        new ValidationCheck(
            (props, propName) => props[propName] === VideoEditingFieldTypes.layoutSelector,
            `expected prop "type" to be "${VideoEditingFieldTypes.layoutSelector}"`,
        ),
    ]),
    selectOptions: PropTypes.arrayOf(
        PropTypes.shape({
            label: PropTypes.string.isRequired,
            configurationValue: PropTypes.oneOfType([PropTypes.string, PropTypes.bool, PropTypes.number])
                .isRequired,
            contentFields: PropTypes.arrayOf(editorMainInlineField),
        }),
    ).isRequired,
});

/**
 * @typedef {(EditorMainInlineField|EditorLayoutSelectorField)} EditorMainField
 */
const editorMainField = PropTypes.oneOfType([editorMainInlineField, editorLayoutSelectorField]);

/**
 * @typedef {BaseEditorField} EditorFontField
 */
const editorFontField = PropTypes.shape({
    ...baseEditorFieldShape,
});

/**
 * @typedef {BaseEditorField} EditorAudioField
 */
const editorAudioField = PropTypes.shape({
    ...baseEditorFieldShape,
    type: getCustomPropValidator('string', true, [
        // Ensure that this field has type "audio"
        new ValidationCheck(
            (props, propName) => props[propName] === VideoEditingFieldTypes.audio,
            `expected prop "type" to be "${VideoEditingFieldTypes.audio}"`,
        ),
    ]),
});

/**
 * @typedef {BaseEditorField} EditorColorField
 */
const editorColorField = PropTypes.shape({
    ...baseEditorFieldShape,
    type: getCustomPropValidator('string', true, [
        // Ensure that this field has type "color"
        new ValidationCheck(
            (props, propName) => props[propName] === VideoEditingFieldTypes.color,
            `expected prop "type" to be "${VideoEditingFieldTypes.color}"`,
        ),
    ]),
});

/**
 * VideoSpec object, which houses the combination of the
 * variant slug and the configuration.
 */
const videoSpec = PropTypes.shape({
    configuration: PropTypes.object,
    variant_slug: PropTypes.string,
});

/**
 * Object representing a template variant,
 * formatted to be consumable by EditorStateProvider
 */
const editorVariant = PropTypes.shape({
    displayName: PropTypes.string,
    slug: PropTypes.string,
    videoTemplateSlug: PropTypes.string,
    defaultConfiguration: PropTypes.object,
    configuration: PropTypes.object,
    width: PropTypes.number,
    height: PropTypes.number,
    aspectRatio: PropTypes.number,
    shouldIncludeGlobalAudio: PropTypes.bool,
    offerSlug: PropTypes.string,
    displayDuration: PropTypes.number,
});

/**
 * Object representing a user video, formatted to be
 * consumable by EditorStateProvider
 */
const editorUserVideo = PropTypes.shape({
    guid: PropTypes.string,
    videoTitle: PropTypes.string,
    configuration: PropTypes.object,
    variantSlug: PropTypes.string,
    variantGUID: PropTypes.string,
    isPurchased: PropTypes.bool,
    createdAt: PropTypes.string,
    updatedAt: PropTypes.string,
});

/**
 * Object representing values returned from the EditorAudioLibraryProvider.
 */
const editorAudioLibrary = PropTypes.shape({
    accountAudio: PropTypes.object,
    globalAudio: PropTypes.object,
});

/**
 * Object representing values returned from the EditorColorLibraryProvider.
 */
const editorColorLibrary = PropTypes.shape({
    colorLibraries: PropTypes.array,
    createAccountCustomColor: PropTypes.func,
    customAccountColors: PropTypes.array,
    loadColorLibraries: PropTypes.func,
});

/**
 * Object representing values returned from the EditorFontLibraryProvider.
 */
const editorFontLibrary = PropTypes.shape({
    fontLibraries: PropTypes.array,
    loadFontLibraries: PropTypes.func,
});

/**
 * Object representing values returned from the EditorImageLibraryProvider.
 */
const editorImageLibrary = PropTypes.shape({
    accountImageLibraries: PropTypes.arrayOf(PropTypes.instanceOf(AccountImageLibrary)),
    areAccountImageLibrariesLoading: PropTypes.bool,
    editingBusinessImageLibraries: PropTypes.arrayOf(PropTypes.instanceOf(BusinessImageLibrary)),
    appliedBusinessImageLibraries: PropTypes.arrayOf(PropTypes.instanceOf(BusinessImageLibrary)),
    areBusinessImagesLoading: PropTypes.bool,
    staticImageLibraries: PropTypes.arrayOf(PropTypes.instanceOf(StaticImageLibrary)),
    onOpenTemplateImagesPanel: PropTypes.func,
    onOpenBusinessProfileImagesPanel: PropTypes.func,
});

/**
 * Object representing cumulative media library provider values.
 */
const editorMediaLibraries = PropTypes.shape({
    audio: editorAudioLibrary,
    color: editorColorLibrary,
    font: editorFontLibrary,
    image: editorImageLibrary,
    video: PropTypes.object,
});

/**
 * Object representing a video asset that's currently in the process of being uploaded to the user's library
 *
 * @typedef   {object}  UploadingEditorVideoAsset
 * @property  {string}  placeholderID   Unique placeholder ID which we will use to replace this asset with the real asset once it's done uploading
 * @property  {number}  progress        The progress of the upload, represented as a percentage from 0-1
 * @property  {string}  updatedAt       The date that the upload started on for sorting purposes
 */
const uploadingEditorVideoAsset = PropTypes.shape({
    placeholderID: PropTypes.string.isRequired,
    progress: PropTypes.number.isRequired,
    updatedAt: PropTypes.instanceOf(Date).isRequired,
});

/**
 * Object representing the url and file type for a processed video asset file
 *
 * @typedef   {object}  EditorVideoAssetSource
 * @property  {string}  url   The URL of the source file
 * @property  {string}  type  The MIME type of the source file (ie, video/mp4)
 */

/**
 * Object representing an account group video asset in the user's library
 *
 * @typedef   {object}  AccountGroupEditorVideoAsset
 * @property  {string}  uploadKey         The Video Processing Service upload key for this video asset
 * @property  {number}  width             Width of the video asset in px
 * @property  {number}  height            Height of the video asset in px
 * @property  {number}  length            Length of the video asset in seconds
 * @property  {EditorVideoAssetSource[]}  sources   Array of objects representing available processed source files for this asset
 * @property  {string}  thumbnailImageURL URL of a thumbnail image representing the asset
 * @property  {string}  displayName       Asset label
 * @property  {string}  order             Order the asset should appear in its library
 */
const accountGroupEditorVideoAsset = PropTypes.shape({
    uploadKey: PropTypes.string.isRequired,
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    length: PropTypes.number.isRequired,
    sources: PropTypes.arrayOf(
        PropTypes.shape({
            url: PropTypes.string,
            type: PropTypes.string,
        }),
    ),
    thumbnailImageURL: PropTypes.string,
    displayName: PropTypes.string,
    order: PropTypes.number.isRequired,
});

/**
 * Describes an audio asset processed by the AudioProcessingSerivce
 *
 * @typedef {object}    WaymarkAPSAsset
 * @property  {object}  location
 * @property  {string}  location.plugin waymark-aps
 * @property  {string}  location.sourceAudio Upload key from AudioProcessingService
 * @property  {string}  type audio
 */
const waymarkAPSAsset = PropTypes.shape({
    location: PropTypes.shape({
        plugin: PropTypes.oneOf([waymarkAPSPluginType]).isRequired,
        sourceAudio: PropTypes.string.isRequired,
    }),
    type: PropTypes.oneOf(['audio']).isRequired,
});

/**
 * Describes base properties for all audio assets
 *
 * @typedef {object} BaseAudioAsset
 * @property {string} displayName Asset name to display in editor
 * @property {string} previewURL Path to hosted audio file
 * @property {string} currentAssetLocation Configuration dotpath that points to the asset's location object
 * @property {boolean} isDynamicAssetType Whether or not the asset can be applied to a layer that can be added or removed from the template
 * @property {string} assetKey Unique key for the asset
 */
const baseAudioAssetProperties = {
    displayName: PropTypes.string,
    previewURL: PropTypes.string,
    currentAssetLocation: PropTypes.string.isRequired,
    isDynamicAssetType: PropTypes.bool.isRequired,
    assetKey: PropTypes.string.isRequired,
};

/**
 * Describes an account audio asset that is currently being uploaded
 */
const uploadingAudioAsset = PropTypes.shape({
    placeholderID: PropTypes.string.isRequired,
    displayName: PropTypes.string.isRequired,
    isUploading: PropTypes.bool.isRequired,
    updatedAt: PropTypes.instanceOf(Date).isRequired,
    waymarkAudioAsset: PropTypes.object.isRequired,
});

/**
 * Describes properties for audio assets that belong to a specific account
 *
 * @typedef {object}  AccountAudioAssetProperties
 * @property {string} guid Audio asset UUID
 * @property {func} onUpdate Callback function invoked when asset is updated
 * @property {func} remove Sets assets `removedAt` property
 * @property {func} restore Sets assets `removedAt` property to null
 * @property {string} removedAt Date string representing when the user removed the asset from their account
 * @property {string} updatedAt Date string representing the last time the asset was updated
 * @property {WaymarkAPSAsset} waymarkAudioAsset Audio asset content configuration value
 *
 * @typedef {BaseAudioAsset & AccountAudioAssetProperties} AccountAudioAsset
 */
const accountAudioAsset = PropTypes.oneOfType([
    uploadingAudioAsset,
    PropTypes.shape({
        ...baseAudioAssetProperties,
        guid: PropTypes.string.isRequired,
        onUpdate: PropTypes.func.isRequired,
        remove: PropTypes.func.isRequired,
        removedAt: PropTypes.string,
        updatedAt: PropTypes.string.isRequired,
        waymarkAudioAsset: waymarkAPSAsset,
    }),
]);

/**
 * Describes properties for global or variant audio assets
 *
 * @typedef {object}  TemplateAudioAssetProperties
 * @property {waymarkAuthorAsset} waymarkAudioAsset Audio asset content configuration value
 *
 * @typedef {BaseAudioAsset & TemplateAudioAssetProperties} TemplateAudioAsset
 */
const templateAudioAsset = PropTypes.shape({
    ...baseAudioAssetProperties,
    waymarkAudioAsset: waymarkAuthorAsset,
});

/**
 * Libraries which contain and manage image assets belonging to the user
 *
 * @typedef {object} ImageLibrary
 */
const imageLibrary = PropTypes.oneOfType([
    PropTypes.instanceOf(AccountImageLibrary),
    PropTypes.instanceOf(BusinessImageLibrary),
    PropTypes.instanceOf(StaticImageLibrary),
]);

/**
 * An image asset in an image library
 */
const imageAsset = PropTypes.instanceOf(ImageAsset);

/**
 *  Collection of video assets with display data
 *
 * @typedef {object} VideoLibrary
 */
const videoLibrary = PropTypes.instanceOf(VideoLibrary);

export default {
    waymarkAuthorAssetLocation,
    waymarkAuthorAsset,
    editorMainInlineField,
    editorColorField,
    editorAudioField,
    editorLayoutSelectorField,
    editorMainField,
    editorImageField,
    editorVideoField,
    editorFontField,
    editorVariant,
    editorUserVideo,
    editorMediaLibraries,
    uploadingEditorVideoAsset,
    videoSpec,
    accountGroupEditorVideoAsset,
    accountAudioAsset,
    templateAudioAsset,
    imageLibrary,
    imageAsset,
    videoLibrary,
};