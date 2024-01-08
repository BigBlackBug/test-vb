// Vendor
import {
  useMemo,
  useEffect,
  useRef,
  useImperativeHandle,
  useCallback,
  HTMLAttributes,
  forwardRef,
} from 'react';
import Cleave from 'cleave.js/react';
import { css, cx as emotionClassNames } from '@emotion/css';

import { themeVars } from '@libs/shared-ui-styles';

// Local
import { uuid } from 'shared/utils/uuid.js';
import AutosizeTextArea from 'shared/components/AutosizeTextArea';

// Styles
import { useTypography } from 'styles/hooks/typography.js';
import useEvent from 'shared/hooks/useEvent';
import useDebounce from 'shared/hooks/useDebounce';
import useThrottle from 'shared/hooks/useThrottle';

enum InputFormat {
  CreditCardNumber = 'creditCardNumber',
  DateMMYY = 'dateMMYY',
}

interface CleaveProps {
  options: Record<string, unknown>;
  inputMode: HTMLAttributes<HTMLInputElement>['inputMode'];
}

// Object keeps track of what props need to be applied to the Cleave component for
// each supported format type
const inputFormatProps: {
  [key in InputFormat]: CleaveProps;
} = {
  [InputFormat.CreditCardNumber]: {
    options: {
      creditCard: true,
    },
    // Setting inputMode allows us to tell mobile browsers that they should open the keyboard's
    // numpad, resulting in a slightly better user experience
    inputMode: 'numeric',
  },
  [InputFormat.DateMMYY]: {
    options: {
      date: true,
      datePattern: ['m', 'y'],
      delimiter: ' / ',
    },
    inputMode: 'numeric',
  },
};

type TextInputElement = HTMLInputElement | HTMLTextAreaElement;

interface ThrottledOnChangeConfig {
  onChange: React.FormEventHandler<TextInputElement>;
  throttleTime: number;
}

interface DebouncedOnChangeConfig {
  onChange: React.FormEventHandler<TextInputElement>;
  debounceTime: number;
}

export interface BaseWaymarkTextInputProps
  extends Omit<React.HTMLProps<TextInputElement>, 'label' | 'ref'> {
  throttledOnChange?: ThrottledOnChangeConfig;
  debouncedOnChange?: DebouncedOnChangeConfig;
  inputClassName?: string | null;
  labelClassName?: string | null;
  subtextClassName?: string | null;
  errorClassName?: string | null;
  isRequired?: boolean;
  label?: React.ReactNode | string | null;
  subtext?: React.ReactNode | string | null;
  hasError?: boolean;
  shouldFocusOnMount?: boolean;
  identifier?: string | null;
  inputIcon?: React.ReactNode | null;
  maxLength?: number;
}

export interface StandardTextInputProps {
  // A standard text input will never have any special props set
  shouldUseStandardTextArea?: never;
  shouldExpandWithDynamicRows?: never;
  formatType?: never;
  minRows?: never;
  maxRows?: never;
}

export interface FormattedCleaveTextInputProps {
  // A formatted Cleave text input will have the special `formatType` prop set
  formatType: `${InputFormat}`;
  shouldUseStandardTextArea?: never;
  shouldExpandWithDynamicRows?: never;
  minRows?: never;
  maxRows?: never;
}

export interface StandardTextAreaProps {
  // A standard text area will have the special `shouldUseStandardTextArea` prop set
  shouldUseStandardTextArea: true;
  shouldExpandWithDynamicRows?: boolean;
  formatType?: never;
  minRows?: never;
  maxRows?: never;
}
export interface AutosizingTextAreaProps {
  // An autosizing text area will have the special `shouldExpandWithDynamicRows` prop set,
  // and can also accept an optional `minRows`, and `maxRows` props
  shouldExpandWithDynamicRows: boolean;
  minRows?: number;
  maxRows?: number;
  shouldUseStandardTextArea?: never;
  formatType?: never;
}

export type WaymarkTextInputProps = BaseWaymarkTextInputProps &
  (
    | StandardTextInputProps
    | FormattedCleaveTextInputProps
    | StandardTextAreaProps
    | AutosizingTextAreaProps
  );

// Infer the element type of the ref based on the props provided to the component; if the props match
// StandardTextAreaProps or AutosizingTextAreaProps, then the ref will be a reference to a textarea element, otherwise it will be
// an input element
type ForwardedRefType<P extends WaymarkTextInputProps> = React.ForwardedRef<
  P extends StandardTextAreaProps | AutosizingTextAreaProps ? HTMLTextAreaElement : HTMLInputElement
>;

/**
 * A reusable text input component which can be used throughout the site
 * and provides various convenient options for configurability
 *
 * @param {string}        [className]                           Custom class name to apply to the wrapper element
 * @param {string}        [inputClassName]                      Custom class name to apply to the input element
 * @param {string}        [labelClassName]                      Custom class name to apply to label above the input
 * @param {string}        [subtextClassName]                    Custom class name to apply to subtext under the input
 * @param {string}        [errorClassName]                      Custom class name to apply to whole element during error state
 * @param {bool}          [isRequired=false]                    Whether to add a "*" to indicate that this field is required
 * @param {string||node}  [label]                               The string or element to use as the label above the input field
 * @param {string||node}  [subtext]                             The string or element to use as the subtext under the input field
 * @param {bool}          [hasError=false]                      Whether the input should show an error state
 * @param {func}          [onChange]                            Function to call when the user makes changes to the text input
 * @param {Object}        [throttledOnChange]                   Object containing a function to call when the user makes changes to the text input and a throttle time
 * @param {func}          [throttledOnChange.onChange]          Function to call when the user makes changes to the text input with throttling applied
 * @param {number}        [throttledOnChange.throttleTime]      Time in milliseconds to throttle the onChange function
 * @param {Object}        [debouncedOnChange]                   Object containing a function to call when the user makes changes to the text input and a debounce time
 * @param {func}          [debouncedOnChange.onChange]          Function to call when the user makes changes to the text input with debouncing applied
 * @param {number}        [debouncedOnChange.debounceTime]      Time in milliseconds to debounce the onChange function
 * @param {bool}          [shouldExpandWithDynamicRows=false]   Whether the input should use the AutosizeTextArea component to dynamically resize
 * @param {bool}          [shouldUseStandardTextArea=false]     This option should be used sparingly, but if you need to render a textarea with a
 *                                                                transition, you have to use a regular textarea. This prevents the text area
 *                                                                from resizing dynamically.
 * @param {bool}          [shouldFocusOnMount=false]            Whether the input should take the browser's focus as soon as it mounts
 * @param {string}        [identifier]                          Unique identifier for the input field - this is nice to have so we can satisfy accessibility
 *                                                                desires by pointing our input label to the input via the htmlFor prop
 * @param {string}        [formatType]                          Specifies how the input text should be auto-formatted using Cleave
 * @param {string||node} inputIcon                              Icon to include in the left side of the input.
 *                                                                Requires outside styling based on icon/size.
 *                                                              .TextInput input { padding-left: X }
 *                                                              .Icon { position: absolute; top: X; margin-left: x; }
 *                                                              Example in ManagedAccountsPage.css
 */
const WaymarkTextInput = forwardRef(
  (props: WaymarkTextInputProps, ref: ForwardedRefType<typeof props>) => {
    const {
      className,
      inputClassName,
      labelClassName,
      subtextClassName,
      errorClassName,
      isRequired,
      label,
      subtext,
      hasError,
      onChange,
      throttledOnChange,
      debouncedOnChange,
      shouldExpandWithDynamicRows,
      shouldUseStandardTextArea,
      shouldFocusOnMount,
      identifier,
      formatType,
      inputIcon,
      minRows,
      maxRows,
      ...spreadProps
    } = props;

    // Either use the provided unique identifier or generate a random one to help with accessibility for
    // pointing label elements to input elements
    const inputIdentifier = useMemo(() => identifier || `input-${uuid()}`, [identifier]);

    const inputRef = useRef<TextInputElement | null>(null);

    // We have an external ref via forwardRef, but we can't use that ref
    // locally within this component, so we'll use the useImperativeHandle hook
    // to expose our internal ref's value as the external ref value
    useImperativeHandle(ref, () => inputRef.current as TextInputElement);

    const [bodyTextStyle, bodySmallTextStyle, headlineTextStyle] = useTypography([
      'body',
      'bodySmall',
      'headline',
    ]);

    const textInputStyle = css`
      ${bodyTextStyle}

      /* We have to set the line height to 1.5rem because the body typography's default
          line-height causes a bug in Chrome where the text input is slightly vertically scrollable */
      line-height: 1.5rem;

      background-color: ${themeVars.color.white};
      border: solid 1px ${themeVars.color.shadow._36};
      padding: 10px 12px;
      margin: 0;
      width: 100%;
      border-radius: 4px;
      transition: all 0.2s ease-in-out;
      /* This will remove the Select Icon and iOS mobile Safari native styling */
      appearance: none;

      &::placeholder {
        color: ${themeVars.color.shadow._56};
      }

      &:focus,
      &:active {
        /* If there isn't an error, highlight the input in blue when focused */
        border-color: ${themeVars.color.brand.default};
        outline: none;
      }

      /* Apply red error styling if the input has an error */
      [for=${inputIdentifier}][data-haserror='true'] &,
      [for=${inputIdentifier}][data-haserror='true'] &:focus,
      [for=${inputIdentifier}][data-haserror='true'] &:active {
        border-color: ${themeVars.color.negative.default};
      }
    `;

    useEffect(() => {
      if (shouldFocusOnMount) {
        // Focus the input after this component has mounted. Some browsers have rules where they refuse to give focus
        // to something that isn’t visible, so if there is some kind of transition being applied to make an input
        // visible then we can't call focus right away.
        const timeoutID = setTimeout(() => inputRef.current?.focus(), 100);
        // Call this when we get unmounted.
        return () => clearTimeout(timeoutID);
      }

      return undefined;
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const onChangeEvent = useEvent(onChange);
    const stableDebouncedOnChange = useDebounce(
      debouncedOnChange?.onChange,
      debouncedOnChange?.debounceTime,
    );
    const stableThrottledOnChange = useThrottle(
      throttledOnChange?.onChange,
      throttledOnChange?.throttleTime,
    );

    // Create a combined onChange handler which calls onChange, debouncedOnChange, and throttledOnChange
    const combinedOnChange: React.FormEventHandler<TextInputElement> = useCallback(
      (event) => {
        onChangeEvent?.(event);
        stableDebouncedOnChange?.(event);
        stableThrottledOnChange?.(event);
      },
      [onChangeEvent, stableDebouncedOnChange, stableThrottledOnChange],
    );

    // Props that are shared between all input types
    const sharedProps = {
      id: inputIdentifier,
      onChange: combinedOnChange,
      // Pass through any other additional props
      ...spreadProps,
    };

    // Get the element we need to render for our input
    let inputElement;

    if (formatType) {
      // If this is a formatted text input, use Cleave
      const formatProps = inputFormatProps[formatType];

      inputElement = (
        <Cleave
          // Cleave only supports old school callback refs, so we have to do that here
          htmlRef={(el: HTMLInputElement) => {
            inputRef.current = el;
          }}
          className={emotionClassNames(textInputStyle, inputClassName)}
          {...formatProps}
          {...sharedProps}
        />
      );
    } else if (shouldExpandWithDynamicRows) {
      // Text area dynamically resizes to fit its contents
      inputElement = (
        <AutosizeTextArea
          inputRef={inputRef as React.RefObject<HTMLTextAreaElement>}
          wrapperClassName={inputClassName}
          className={textInputStyle}
          minRows={minRows}
          maxRows={maxRows}
          {...sharedProps}
        />
      );
    } else if (shouldUseStandardTextArea) {
      // Non-dynamic sized textarea.
      inputElement = (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          className={emotionClassNames(textInputStyle, inputClassName)}
          {...sharedProps}
        />
      );
    } else {
      // By default use a standard <input>
      inputElement = (
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          className={emotionClassNames(textInputStyle, inputClassName)}
          {...sharedProps}
        />
      );
    }

    return (
      // Even though the label is being used correctly here, this eslint rule isn't smart enough
      // to figure it out since the <input> element is somewhat abstracted away
      <label
        htmlFor={inputIdentifier}
        className={emotionClassNames(
          css`
            display: block;
            color: inherit;

            &[data-haserror='true'] {
              color: ${themeVars.color.negative.default};
            }
          `,
          className,
          hasError ? errorClassName : null,
        )}
        data-haserror={hasError}
      >
        {label && (
          <div
            className={emotionClassNames(
              headlineTextStyle,
              css`
                margin-bottom: 6px;
                transition: color 0.2s ease-in-out;
              `,
              labelClassName,
            )}
          >
            {label}

            {/* Add an asterisk to the label if the field is required */}
            {isRequired && '*'}
          </div>
        )}
        {inputElement}
        {inputIcon}
        {subtext != null && (
          <div
            className={emotionClassNames(
              bodySmallTextStyle,
              css`
                margin-top: 4px;
              `,
              subtextClassName,
            )}
          >
            {subtext}
          </div>
        )}
      </label>
    );
  },
);
WaymarkTextInput.defaultProps = {
  throttledOnChange: undefined,
  debouncedOnChange: undefined,
  inputClassName: null,
  labelClassName: null,
  subtextClassName: null,
  errorClassName: null,
  isRequired: false,
  label: null,
  subtext: null,
  hasError: false,
  shouldFocusOnMount: false,
  identifier: null,
  inputIcon: null,
  maxLength: undefined,
};

export default WaymarkTextInput;
