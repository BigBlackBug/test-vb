// Vendor
import _ from 'lodash';
import Ajv from 'ajv';

// Local
import {
    VideoEditingFieldTypes
} from 'editor/constants/Editor';

/* WAYMARK APP DEPENDENCIES */
import {
    formDescriptionSchema
} from 'app/constants/VideoEditingFormDescriptionSchema.js';
/* END WAYMARK APP DEPENDENCIES */

// Take a basic form description configuration and format it for use in the editor
export const formatEditorFormDescription = (
    formDescription,
    shouldRequireValidFormDescription = true,
) => {
    // Set up JSON validation
    const ajv = new Ajv({
        allErrors: true
    });
    const validator = ajv.compile(formDescriptionSchema);

    // Validate the given form description against our form description schema
    const isValid = validator(formDescription);

    if (!isValid) {
        if (shouldRequireValidFormDescription) {
            // If the form description is invalid, throw an error
            console.error('Editor form description is invalid', validator.errors);
            return null;
        }

        console.warn(
            'Editor form description is invalid. The form description will still be formatted for the editor. To change this behavior, set "shouldRequireValidFormDescription" to true.',
            validator.errors,
        );
    }

    const formattedFormDescription = {};

    // Go through all of the received form fields and sort them based on their types
    formDescription.editingFormFields.forEach((editingFormField) => {
        // Ensure we deeply clone the field so we don't modify the original and cause
        // weird stuff to happen
        const formField = _.cloneDeep(editingFormField);

        switch (formField.type) {
            // Text and text selector fields will be sorted into field groups
            case VideoEditingFieldTypes.text:
            case VideoEditingFieldTypes.textSelector:
            case VideoEditingFieldTypes.image:
            case VideoEditingFieldTypes.video:
                // If no main field groups yet, initialize as an array with one group object that has this field in it
                if (!formattedFormDescription.mainFields) {
                    formattedFormDescription.mainFields = [formField];
                } else {
                    // Check if there's a layout selector whose display time matches the field
                    const matchingLayoutSelector = _.find(formattedFormDescription.mainFields, {
                        displayTime: formField.displayTime,
                        type: VideoEditingFieldTypes.layoutSelector,
                    });

                    if (matchingLayoutSelector) {
                        // If we have a matching layout selector with the same timestamp, loop through all of its select options and append the field to
                        // all of their contentFields since this field should be grouped with them
                        matchingLayoutSelector.selectOptions.forEach((selectOption) => {
                            // Insert the form field into the matching layout selector options
                            selectOption.contentFields.splice(
                                _.sortedLastIndexBy(selectOption.contentFields, formField, ({
                                        type
                                    }) =>
                                    // Ensure fields remain sorted so that images are grouped before text fields
                                    type === VideoEditingFieldTypes.image ? -1 : 1,
                                ),
                                0,
                                formField,
                            );
                        });
                    } else {
                        formattedFormDescription.mainFields.splice(
                            // Get the index to insert this field at in order to keep everything sorted by display time
                            // Getting the last index so that the way things are ordered in the unformatted form description will be respected
                            _.sortedLastIndexBy(formattedFormDescription.mainFields, formField, 'displayTime'),
                            0,
                            formField,
                        );
                    }
                }
                break;
            case VideoEditingFieldTypes.layoutSelector:
                // If no main field groups yet, initialize as an array with one group object that has this field in it
                if (!formattedFormDescription.mainFields) {
                    formattedFormDescription.mainFields = [formField];
                } else {
                    // Check if there are any fields whose display times match this layout selector
                    // Any matching fields will be removed from the mainFields array so that we can group them with
                    // the layout selector's fields instead
                    const matchingFields = _.remove(formattedFormDescription.mainFields, {
                        displayTime: formField.displayTime,
                    });

                    matchingFields.forEach((matchingField) => {
                        // If we have any matching fields, loop through them and append them to the contents of all of this layout selector's
                        // options so they'll be grouped in with the selector
                        formField.selectOptions.forEach((selectOption) => {
                            // Merge the matching fields into the select option's content fields
                            selectOption.contentFields.splice(
                                _.sortedLastIndexBy(selectOption.contentFields, matchingField, ({
                                        type
                                    }) =>
                                    // Ensure fields remain sorted so that images are grouped before text fields
                                    type === VideoEditingFieldTypes.image ? -1 : 1,
                                ),
                                0,
                                matchingField,
                            );
                        });
                    });

                    formattedFormDescription.mainFields.splice(
                        // Get the index to insert the layout selector at which will keep everything sorted by display time
                        _.sortedLastIndexBy(formattedFormDescription.mainFields, formField, 'displayTime'),
                        0,
                        formField,
                    );
                }
                break;
            case VideoEditingFieldTypes.color:
                if (!formattedFormDescription.colorFields) {
                    formattedFormDescription.colorFields = [formField];
                } else {
                    formattedFormDescription.colorFields.splice(
                        // Get the index to insert this color field at which will keep everything sorted by display time
                        _.sortedLastIndexBy(formattedFormDescription.colorFields, formField, 'displayTime'),
                        0,
                        formField,
                    );
                }
                break;
            case VideoEditingFieldTypes.audio:
                formattedFormDescription.audioField = formField;
                break;
            case VideoEditingFieldTypes.font:
                formattedFormDescription.fontField = formField;
                break;

            default:
                console.error('Form description contains unrecognized field type:', formField.type);
        }
    });

    // We'd like to guarantee that these properties exist, even if they're empty.
    // TODO: This should probably be initialized up top, but I didn't want to mess with the logic.
    formattedFormDescription.mainFields = formattedFormDescription.mainFields ? ? [];
    formattedFormDescription.colorFields = formattedFormDescription.colorFields ? ? [];
    formattedFormDescription.audioField = formattedFormDescription.audioField ? ? null;
    formattedFormDescription.fontField = formattedFormDescription.fontField ? ? null;

    return formattedFormDescription;
};

/**
 * Create a configuration value for a Waymark-provided audio asset
 * @param  {string} audioPath Path to audio file
 * @return {obj}              Waymark audio asset.
 */
export const getWaymarkAudioConfigurationValue = (audioPath) => ({
    location: {
        plugin: 'waymark',
        type: 'socialproofImagesWeb',
        key: audioPath,
    },
    type: 'audio',
});

/**
 * Based on the provided image field object, returns the desired aspect ratio for the image, or `null`
 * if there's no fixed aspect ratio.
 * @param  {Object} imageField
 * @returns {number||null}
 */
export const getAspectRatioFromImageField = (imageField) =>
    imageField.aspectRatio ||
    // If no aspect ratio was provided but we do have a set width/height, derive
    // the aspect ratio from that
    (imageField.width ?
        imageField.width / imageField.height : // Fallback to null if no aspect ratio or width/heigth are provided - this means
        // the image field has a free aspect ratio
        null);

/**
 * Parse an editor form object and return text editing fields ordered by display time.
 * @param {Array[Dict]} editorForm: WaymarAuthorBundle editing form fields.
 */
export const getTextEditingFields = (editorForm) => {
    const sortedEditingFields = _.orderBy(editorForm, 'displayTime');

    return sortedEditingFields.reduce((textEditingFields, editingField) => {
        if (editingField.type === VideoEditingFieldTypes.text) {
            // Text editing fields can be directly added to the return value.
            textEditingFields.push(editingField);
        } else if (editingField.type === VideoEditingFieldTypes.layoutSelector) {
            // Text fields are nested in layout selector's select option's contentFields.
            editingField.selectOptions.forEach((option) => {
                option.contentFields.forEach((contentField) => {
                    if (contentField.type === VideoEditingFieldTypes.text) {
                        textEditingFields.push(contentField);
                    }
                });
            });
        }

        return textEditingFields;
    }, []);
};