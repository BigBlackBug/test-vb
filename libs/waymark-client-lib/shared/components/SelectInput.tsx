// Vendor
import { css, cx as emotionClassNames } from '@emotion/css';

// Styles
import { themeVars } from '@libs/shared-ui-styles';
import { useTypography } from 'styles/hooks/typography.js';

interface SelectInputProps {
  disabledStateText?: string | null;
  fieldProps?: React.HTMLAttributes<HTMLSelectElement> & {
    disabled?: boolean;
    value?: string;
  };
  options: Array<{ key?: string; value: string; text: string; disabled?: boolean }>;
  isRequired?: boolean;
  label?: string;
  labelClassName?: string;
  inputClassName?: string;
  name?: string;
  placeholder?: string | null;
  subtext?: React.ReactNode | null;
  validationState?: 'error' | null;
}

/**
 * A component that renders an individual select element.
 *
 * @param {string}       disabledStateText Message for a disabled option.
 * @param {object}       fieldProps        Props that define classNames, focus and blur behavior, and disabled states.
 * @param {boolean}      isRequired        Denotes if the select element is required for a form.
 * @param {string}       label             Title or label for the select element.
 * @param {string}       name              The name of the select element.
 * @param {[options]}    options           The options for the select element.
 * @param {string}       placeholder       Optional text for placeholder option.
 * @param {string||node} subtext           Subtext or error message below form field.
 * @param {string}       validationState   Whether or not the select element is valid.
 */
export default function SelectInput({
  fieldProps = {},
  isRequired = false,
  label = '',
  labelClassName = undefined,
  inputClassName = undefined,
  name = '',
  options = [],
  placeholder = null,
  subtext = null,
  validationState = null,
  disabledStateText = null,
}: SelectInputProps) {
  const { disabled = false, className, ...extendedProps } = fieldProps;

  if (placeholder && !extendedProps.value) {
    extendedProps.defaultValue = '';
  }

  const [headlineTextStyles, bodyTextStyles, bodySmallTextStyles] = useTypography([
    'headline',
    'body',
    'bodySmall',
  ]);

  return (
    <div data-haserror={validationState === 'error' || null} className={className}>
      <label
        htmlFor={name}
        className={css`
          display: block;
        `}
      >
        {label ? (
          <div
            className={emotionClassNames(
              headlineTextStyles,
              css`
                margin-bottom: 6px;

                [data-haserror] & {
                  color: ${themeVars.color.negative.default};
                }

                transition: color 0.2s ease-in-out;
              `,
              labelClassName,
            )}
          >
            {label}
            {isRequired ? '*' : ''}
          </div>
        ) : null}
        <select
          {...extendedProps}
          disabled={disabled}
          className={emotionClassNames(
            bodyTextStyles,
            css`
              background-color: ${themeVars.color.white};
              padding: 10px 32px 10px 12px;
              margin: 0;
              width: 100%;
              border-radius: 4px;
              border: solid 1px ${themeVars.color.shadow._36};
              transition: all 0.2s ease-in-out;
              /* This will remove the Select Icon and iOS mobile Safari native styling */
              -webkit-appearance: none;
              /* Use an SVG with a down arrow as the background image so the input has a dropdown arrow */
              background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='10' viewBox='0 0 17 10' %3E%3Cpath fill='%251d2129' fillRule='evenodd' d='M8.405 10h-.007a1.21 1.21 0 0 1-.865-.375L.351 2.131A1.275 1.275 0 0 1 .365.36a1.203 1.203 0 0 1 1.73.015l6.322 6.597 6.5-6.608a1.2 1.2 0 0 1 1.729.008 1.275 1.275 0 0 1-.008 1.771L9.266 9.637a1.207 1.207 0 0 1-.86.363' /%3E%3C/svg%3E");
              background-position: calc(100% - 10px) center;
              background-repeat: no-repeat;

              &:focus,
              &:active {
                border-color: ${themeVars.color.brand.default};
                outline: none;
              }

              [data-haserror] & {
                color: ${themeVars.color.negative.default};
                border-color: currentColor;
              }
            `,
            inputClassName,
          )}
        >
          {disabled && disabledStateText ? (
            <option disabled>{disabledStateText}</option>
          ) : (
            <>
              {placeholder && (
                <option value="" disabled>
                  {placeholder}
                </option>
              )}
              {options.map((option) => (
                <option
                  key={option.key || option.value}
                  value={option.value}
                  disabled={option.disabled}
                >
                  {option.text}
                </option>
              ))}
            </>
          )}
        </select>
        {subtext && (
          <div
            className={emotionClassNames(
              bodySmallTextStyles,
              css`
                margin-top: 4px;
                [data-haserror] & {
                  color: ${themeVars.color.negative.default};
                }
              `,
            )}
          >
            {subtext}
          </div>
        )}
      </label>
    </div>
  );
}
