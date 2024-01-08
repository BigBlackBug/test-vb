// Vendor
import _ from 'lodash';

// Local
import {
    VideoEditingFieldTypes
} from 'editor/constants/Editor';
import {
    toPrecision
} from 'shared/utils/math.js';

/**
 * Takes an editor field or array of editor fields and gathers stats on the total number of
 * that type of field in the video and how many of those fields were edited between a given initial and final configuration.
 *
 * Output will be an object that looks something like:
 * {
 *  text: { totalCount: 10, editedCount: 5 },
 *  image: { totalCount: 15, editedCount: 2 },
 *  ...
 * }
 *
 * This does account for fields nested inside of layout selectors. In those cases, we will mark
 */
function getEditedFieldStats(editorFields, initialConfiguration, finalConfiguration) {
    if (!editorFields) return {};

    const editorFieldsArray = Array.isArray(editorFields) ? editorFields : [editorFields];

    const editedFieldCounts = {};

    editorFieldsArray.forEach((field) => {
        const fieldConfigurationPaths =
            field.type === VideoEditingFieldTypes.font ? // Font fields store configuration paths in a different way from other field types
            Object.keys(field.respectedPathMappings) :
            field.paths;

        const originalValue = _.get(initialConfiguration, fieldConfigurationPaths[0]);
        const finalValue = _.get(finalConfiguration, fieldConfigurationPaths[0]);

        const isEdited = !_.isEqual(originalValue, finalValue);

        if (!editedFieldCounts[field.type]) {
            editedFieldCounts[field.type] = {
                totalCount: 0,
                editedCount: 0,
            };
        }

        editedFieldCounts[field.type].totalCount += 1;
        if (isEdited) {
            editedFieldCounts[field.type].editedCount += 1;
        }

        if (field.type === VideoEditingFieldTypes.layoutSelector) {
            const selectedOption = field.selectOptions.find(
                ({
                    configurationValue
                }) => configurationValue === finalValue,
            );
            const layoutSelectorEditedFieldCounts = getEditedFieldStats(
                selectedOption.contentFields,
                initialConfiguration,
                finalConfiguration,
            );

            Object.entries(layoutSelectorEditedFieldCounts).forEach(([key, value]) => {
                if (!editedFieldCounts[key]) {
                    editedFieldCounts[key] = value;
                } else {
                    editedFieldCounts[key].totalCount += value.totalCount;
                    editedFieldCounts[key].editedCount += value.editedCount;
                }
            });
        }
    });

    return editedFieldCounts;
}

/**
 * Takes the video's form description, an initial configuration, and a final configuration,
 * and returns an object describing what percent of each field in the video has been modified
 * between the two configurations.
 *
 * The output will look something like:
 * {
 *  percentTextFieldsEdited: 50, // 50% of text fields in the template were edited
 *  percentImageFieldsEdited: 13.33, // 13.33% of image fields in the template were edited
 *  percentFontFieldsEdited: 0, // the user didn't change the font
 *  percentAllFieldsEdited: 26.92, // overall, 26.92% of all editable fields were edited
 * }
 */
// eslint-disable-next-line import/prefer-default-export
export function getPercentEditorFieldsEditedMetrics(
    formDescription,
    initialConfiguration,
    finalConfiguration,
) {
    // Gather up stats on the total number of each type of field in the video and how many of those fields have been edited
    const combinedEditedFieldStats = {
        ...getEditedFieldStats(formDescription.mainFields, initialConfiguration, finalConfiguration),
        ...getEditedFieldStats(formDescription.audioField, initialConfiguration, finalConfiguration),
        ...getEditedFieldStats(formDescription.colorFields, initialConfiguration, finalConfiguration),
        ...getEditedFieldStats(formDescription.fontField, initialConfiguration, finalConfiguration),
    };

    let totalFieldCount = 0;
    let totalEditedFieldCount = 0;

    // Distill down the edited field stats into percentages of how many of each field was edited
    const percentEditedFieldStats = {};
    Object.entries(combinedEditedFieldStats).forEach(([key, value]) => {
        totalFieldCount += value.totalCount;
        totalEditedFieldCount += value.editedCount;

        percentEditedFieldStats[`percent${key[0].toUpperCase()}${key.slice(1)}FieldsEdited`] =
            toPrecision((100 * value.editedCount) / value.totalCount, 2);
    });

    percentEditedFieldStats.percentAllFieldsEdited = toPrecision(
        (100 * totalEditedFieldCount) / totalFieldCount,
        2,
    );

    return percentEditedFieldStats;
}