// Vendor
import { css, cx as emotionClassNames } from '@emotion/css';

// Shared
import WaymarkTextInput, { WaymarkTextInputProps } from 'shared/components/WaymarkTextInput';
import { WaymarkButton, WaymarkButtonProps } from 'shared/components/WaymarkButton';
import SelectInput from 'shared/components/SelectInput';

// Styles
import typographyStyles from 'styles/themes/waymark/typography.js';
import { darkerCoolGrayColor, grayColor } from 'styles/themes/waymark/colors.js';
import breakpoints from 'styles/constants/breakpoints.js';
import classNames from 'classnames';

type FormProps = React.ComponentPropsWithoutRef<'form'>;

/**
 * Pre-styled form input which matches the styles seen in the AI1X page.
 */
export function Form({ className, ...props }: FormProps) {
  return (
    <form
      className={emotionClassNames(
        css`
          width: 100%;
          max-width: 1024px;
          display: flex;
          gap: 16px;

          @media ${breakpoints.small.queryDown} {
            flex-direction: column;
            gap: 12px;
          }
        `,
        className,
      )}
      {...props}
    />
  );
}

// Box shadow styles used for text input and submit button elements in the forms
export const formElementShadowStyle = css`
  box-shadow: 0px 12px 24px 0px rgba(0, 0, 0, 0.05), 0px 4px 4px 0px rgba(0, 0, 0, 0.04);
`;

export const baseInputStyles = emotionClassNames(
  css`
    padding: 2.25rem 1.5rem 1.25rem;
    border-radius: 16px;
    border: none;
    &::placeholder {
      color: ${grayColor};
    }
  `,
  formElementShadowStyle,
);

export const baseInputLabelStyles = emotionClassNames(
  typographyStyles.caption2,
  css`
    position: absolute;
    top: 1rem;
    left: 1.5rem;
    z-index: 1;
    color: ${darkerCoolGrayColor};
  `,
);

/**
 * Pre-styled text input for use in all forms in the AI1X UI.
 */
export function FormTextInput({
  className,
  labelClassName,
  inputClassName,
  ...props
}: WaymarkTextInputProps) {
  return (
    <WaymarkTextInput
      className={emotionClassNames(
        css`
          position: relative;
        `,
        className,
      )}
      labelClassName={emotionClassNames(baseInputLabelStyles, labelClassName)}
      inputClassName={emotionClassNames(baseInputStyles, inputClassName)}
      {...props}
    />
  );
}

interface SelectInputOption {
  value: string;
  text: string;
}
interface FormSelectInputProps {
  label: string;
  placeholder: string;
  options: SelectInputOption[];
  className?: string;
  inputClassName?: string;
  labelClassName?: string;
  value?: string;
  onChange?: (event: React.FormEvent<HTMLSelectElement>) => void;
}
/**
 * Pre-styled select input for use in AI1X UI forms
 */
export function FormSelectInput({
  label,
  placeholder,
  className = undefined,
  inputClassName = undefined,
  labelClassName = undefined,
  onChange = undefined,
  value = undefined,
  options,
}: FormSelectInputProps) {
  return (
    <SelectInput
      label={label}
      placeholder={placeholder}
      options={options}
      fieldProps={{
        className: emotionClassNames(
          css`
            position: relative;
          `,
          className,
        ),
        onChange,
        value,
      }}
      labelClassName={emotionClassNames(baseInputLabelStyles, labelClassName)}
      inputClassName={emotionClassNames(
        baseInputStyles,
        css`
          line-height: 1.5rem;
          padding-right: 3rem;
          background-position: calc(100% - 1rem) center;
        `,
        inputClassName,
      )}
    />
  );
}

/**
 * Pre-styled submit button for use in all forms in the AI1X UI.
 */
export function FormSubmitButton({ className, ...props }: WaymarkButtonProps) {
  return (
    <WaymarkButton
      type="submit"
      colorTheme="Primary"
      isLarge
      className={classNames(formElementShadowStyle, className)}
      {...props}
    />
  );
}
