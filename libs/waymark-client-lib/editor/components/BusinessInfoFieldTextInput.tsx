import { useEffect, useState } from 'react';
import classNames from 'classnames';

import { CoreBusinessDetails } from 'shared/api/graphql/businesses/fragments';
import WaymarkTextInput from 'shared/components/WaymarkTextInput';
import { isValidURL } from 'shared/utils/urls.js';
import { textInput, textInputLabel } from './BusinessInfoFieldTextInput.css';

// Defines basic validation for a business form
export const fieldValueValidators: {
  [k in keyof CoreBusinessDetails]?: (value: string) => string | null;
} = {
  // businessName is required
  businessName: (value: string) => {
    if (!value) {
      return 'Business name is required';
    }

    return null;
  },
  // Website URL is not required, but should be a valid URL if provided
  websiteUrl: (value: string) => {
    if (!isValidURL(value).isValid) {
      return 'Please enter a valid website url.';
    }

    return null;
  },
};

interface BusinessInfoFieldTextInputProps<TFieldName extends keyof CoreBusinessDetails> {
  /** Object with data describing core field values on the Business being edited which
   * we'll use to get the default value that should initially be displayed in this input */
  businessDetails: CoreBusinessDetails | null;
  /** The name of the field which maps directly to the field's name in GraphQL queries and mutations.
   * We use this to get the default value off of the businessDetails and to update the modifications that
   * we'll apply when mutating the Business record */
  name: TFieldName;
  /** Callback to call with an object describing how this form field was changed when the input's value changes */
  onChange: (formChange: Partial<CoreBusinessDetails>) => void;
  /** Optional className to apply additional custom styling on top of the core basic styles */
  className?: string | null;
  /** Optional value to display in a label above the text field */
  label?: string;
  /** Optional value to display as placeholder text in the input */
  placeholder?: string;
  /** Whether or not the text input should expand vertically with dynamic rows  */
  shouldExpandWithDynamicRows?: boolean;
  /** Maximum number of rows the text input can expand to */
  maxRows?: number;
  /** Minimum number of rows the text input should be displayed with */
  minRows?: number;
}

/**
 * Renders a standardized text input which can edit the value of a field on a Business record
 */
export default function BusinessInfoFieldTextInput<TFieldName extends keyof CoreBusinessDetails>({
  businessDetails,
  name,
  onChange,
  className = null,
  shouldExpandWithDynamicRows = false,
  ...props
}: BusinessInfoFieldTextInputProps<TFieldName>) {
  // Track the value that's currently saved on the business so we can reflect external changes
  // to the field value
  const currentSavedValue = businessDetails?.[name] ?? '';

  const [inputValue, setInputValue] = useState<string>(currentSavedValue);
  const [fieldError, setFieldError] = useState<string | null>(null);

  useEffect(() => {
    setInputValue(currentSavedValue);
  }, [currentSavedValue]);

  useEffect(() => {
    const validationErrorMessage = fieldValueValidators[name]?.(inputValue);
    setFieldError(validationErrorMessage || null);

    onChange({
      // If the value is invalid, set `undefined` as the form change value;
      // this means any changes to this field will be ignored when the mutation is
      // submitted
      [name]: validationErrorMessage ? undefined : inputValue,
    });
  }, [inputValue, name, onChange]);

  return (
    <WaymarkTextInput
      name={name}
      value={inputValue}
      onChange={(event) => setInputValue((event.target as HTMLInputElement).value)}
      className={classNames(textInput, className)}
      labelClassName={textInputLabel}
      subtext={fieldError}
      hasError={Boolean(fieldError)}
      shouldExpandWithDynamicRows={shouldExpandWithDynamicRows ? true : false}
      {...props}
    />
  );
}
