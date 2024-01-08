// Vendor
import { forwardRef } from 'react';
import classNames from 'classnames';
import { buttonStyleVariants, typographyStyleVariants } from '@libs/shared-ui-styles';

// Local
import { DotLoader } from '../DotLoader';

import {
  button,
  dotLoader,
  ButtonSize,
  dataButtonSize,
  dataIsLoading,
  dataIsDisabled,
  dataHasFill,
  dataIsUppercase,
} from './Button.css';

export interface ButtonProps extends React.ComponentPropsWithoutRef<'button'> {
  /**
   * The name of a button theme class to apply to the button. All button themes are defined in "@libs/shared-ui-styles/buttonStyleVariants.ts"
   */
  colorTheme?: keyof typeof buttonStyleVariants | null;
  /**
   * The name of a typography style class to apply to the button. If not provided, the button will default to
   * either "button" or "buttonSmall" depending on the `isSmall`/`isLarge` props
   */
  typography?: keyof typeof typographyStyleVariants | null;
  /**
   * Optional text that will appear in a tooltip when you hover over the button
   */
  tooltipText?: string | null;
  /**
   * Whether the button should be disabled and show a loading animation
   *
   * @default false
   */
  isLoading?: boolean;
  /**
   * Optional custom color to set on the dot loader which is shown when the `isLoading` prop is set to true.
   * By default, this will inherit the same color as the button's text
   */
  dotLoaderColor?: string;
  /**
   * Whether the button is disabled, meaning it is styled as greyed out and cannot be clicked
   *
   * @default false
   */
  isDisabled?: boolean;
  /**
   * Whether the button should have some padding around its contents and background fill
   *
   * @default true
   */
  hasFill?: boolean;
  /**
   * Whether the button should have smaller padding and font size
   *
   * @default false
   */
  isSmall?: boolean;
  /**
   * Whether the button should have larger padding
   *
   * @default false
   */
  isLarge?: boolean;
  /**
   * Whether the button's text should be transformed to uppercase
   *
   * @default true
   */
  isUppercase?: boolean;
}

/**
 * A convenient button component used for buttons with onClick events which provides
 * a ton of convenient utilities to make our lives easier - its styling can be set with
 * preset themes and it makes it very easy to apply analytics tracking without needing
 * to wrap anything
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    colorTheme = 'BlackText',
    typography = null,
    tooltipText = null,
    className,
    onClick,
    isLoading = false,
    dotLoaderColor = undefined,
    isDisabled = false,
    hasFill = true,
    isSmall = false,
    isLarge = false,
    isUppercase = true,
    type = 'button',
    children,
    ...props
  },
  ref,
) {
  const onClickButton: React.MouseEventHandler<HTMLButtonElement> = (event) => {
    // If the button is disabled and it has somehow been clicked anyways,
    // cancel the click/return early since this button shouldn't do anything
    if (isDisabled || isLoading) {
      event.preventDefault();
      return;
    }

    onClick?.(event);
  };

  let typographyClass = typography ? typographyStyleVariants[typography] : null;

  if (!typography) {
    typographyClass = isLarge
      ? typographyStyleVariants.button
      : typographyStyleVariants.buttonSmall;
  }

  let buttonSize: ButtonSize = 'small';

  if (isSmall) {
    buttonSize = 'tiny';
  } else if (isLarge) {
    buttonSize = 'large';
  }

  return (
    <button
      ref={ref}
      onClick={onClickButton}
      type={type}
      title={tooltipText || undefined}
      // Visually disable the button if it's disabled or in a loading state
      disabled={isDisabled || isLoading}
      className={classNames(
        button,
        colorTheme ? buttonStyleVariants[colorTheme] : null,
        typographyClass,
        className,
      )}
      data-testid="waymark-button"
      {...dataIsLoading(isLoading)}
      {...dataIsDisabled(isDisabled)}
      {...dataIsUppercase(isUppercase)}
      {...dataHasFill(hasFill)}
      {...dataButtonSize(buttonSize)}
      // Spread any additional props on the button
      {...props}
    >
      {/* If the button is loading, show a dot loader in place of the button's contents */}
      {isLoading ? (
        <DotLoader
          // In order to allow the dot loader to inherit the button's text color, we need to also set the color theme
          // class on the dot loader itself; this makes it easier for us to make the dots' colors just `currentColor`,
          // without any disruption from the fact that we need to hide button contents other than the loader using `color: transparent`
          className={classNames(colorTheme ? buttonStyleVariants[colorTheme] : null, dotLoader)}
          {...dataIsDisabled(isDisabled)}
          style={{
            color: dotLoaderColor,
          }}
        />
      ) : null}
      {children}
    </button>
  );
});
