export enum FormFieldType {
  Audio = 'audio',
  Color = 'color',
  Font = 'font',
  FontOverride = 'font_override',
  Image = 'image',
  LayoutSelector = 'layout_selector',
  Text = 'text',
  TextSelector = 'text_selector',
  Video = 'video',
}

export interface BaseEditingFormField {
  editingFieldKey: string;
  displayTime: number | null;
  label: string;
  type: FormFieldType;
}

export interface FontFormField extends BaseEditingFormField {
  type: FormFieldType.Font;
  fontOverrides: {
    [key: string]: {
      originalTypography: {
        fontFamily: string;
        fontSizeAdjustment: number;
        fontStyle: string;
        fontWeight: number;
      };
      paths: string[];
    };
  };
  respectedPathMappings: {
    [key: string]: string[];
  };
}

export interface FontOverrideFormField extends BasePathedEditingFormField {
  type: FormFieldType.FontOverride;
}

export interface BasePathedEditingFormField extends BaseEditingFormField {
  paths: string[];
}

export interface TextFormField extends BasePathedEditingFormField {
  type: FormFieldType.Text;
  characterLimit: number | null;
}

export interface TextSelectorFormField extends BasePathedEditingFormField {
  type: FormFieldType.TextSelector;
}

export interface ImageFormField extends BasePathedEditingFormField {
  type: FormFieldType.Image;
  width: number | null;
  height: number | null;
}

export interface VideoFormField extends BasePathedEditingFormField {
  type: FormFieldType.Video;
  inPoint: number;
  outPoint: number;
}

// Layout selector
export type LayoutSelectorOptionContentField =
  | TextFormField
  | TextSelectorFormField
  | ImageFormField
  | VideoFormField;

export interface LayoutSelectorOption {
  configurationValue: string;
  label: string;
  contentFields: LayoutSelectorOptionContentField[];
}

export interface LayoutSelectorFormField extends BasePathedEditingFormField {
  type: FormFieldType.LayoutSelector;
  selectOptions: LayoutSelectorOption[];
}

export interface AudioFormField extends BasePathedEditingFormField {
  type: FormFieldType.Audio;
  selectOptions: {
    configurationValue: {
      location: {
        plugin: 'waymark';
        type: string;
        key: string;
      };
      type: 'audio';
    };
    label: string;
  }[];
}

export interface ColorFormField extends BasePathedEditingFormField {
  type: FormFieldType.Color;
}

export type EditingFormField =
  | TextFormField
  | TextSelectorFormField
  | ImageFormField
  | VideoFormField
  | LayoutSelectorFormField
  | AudioFormField
  | ColorFormField
  | FontFormField
  | FontOverrideFormField;

export interface EditingForm {
  editingFormFields: EditingFormField[];
}

export const PathMungingFieldTypes: string[] = [FormFieldType.Image, FormFieldType.Video];

export function getTargetPath(field: EditingFormField): string | null {
  if ('paths' in field) {
    return PathMungingFieldTypes.includes(field.type)
      ? field.paths[0].split('.content')[0]
      : field.paths[0];
  }
  return null;
}
