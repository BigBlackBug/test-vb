// Vendor
import _ from 'lodash';
import { css } from '@emotion/css';

// Editor
import { EditorControlSectionHeading } from 'editor/components/EditorControlHeadings';
import { useEditorFieldsOfType } from 'editor/providers/EditorFormDescriptionProvider.js';
import { VideoEditingFieldTypes } from 'editor/constants/Editor';

import LayoutSelector from './LayoutSelector.js';
import MainField from './MainField.js';
import {
  FormFieldType,
  ImageFormField,
  LayoutSelectorFormField,
  TextFormField,
  VideoFormField,
} from '@libs/shared-types';

/**
 * Renders all main field groups
 */
export default function MainFieldList() {
  const mainFields: Array<
    TextFormField | ImageFormField | VideoFormField | LayoutSelectorFormField
  > = useEditorFieldsOfType(VideoEditingFieldTypes.main);

  if (_.isEmpty(mainFields)) {
    return null;
  }

  return (
    <>
      <EditorControlSectionHeading
        heading="Edit Content"
        className={css`
          margin: 42px 0 18px;
        `}
      />
      <div
        className={css`
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          grid-gap: 18px 12px;
        `}
      >
        {mainFields.map(
          (mainField) =>
            mainField && (
              <div
                key={mainField.editingFieldKey}
                style={{
                  gridColumn:
                    mainField.type !== VideoEditingFieldTypes.image &&
                    mainField.type !== VideoEditingFieldTypes.video
                      ? // Non-image/video fields should expand to fill their row on the grid
                        '1 / 4'
                      : 'auto',
                }}
              >
                {mainField.type === FormFieldType.LayoutSelector ? (
                  // If this field is a layout selector, render a special component for that which
                  // will allow the user to switch between layouts to reveal different main fields
                  <LayoutSelector layoutSelectorConfig={mainField} />
                ) : (
                  <MainField mainFieldConfig={mainField} />
                )}
              </div>
            ),
        )}
      </div>
    </>
  );
}
