// Vendor
import classNames from 'classnames';

import { themeVars } from '@libs/shared-ui-styles';

import { rotatingLoader } from './RotatingLoader.css';

interface RotatingLoaderProps extends React.ComponentPropsWithoutRef<'svg'> {
  /**
   * The color of the loading spinner.
   *
   * @defaultValue themeVars.color.brand.default
   */
  color?: string;
  /**
   * The width of the loading spinner icon's stroke.
   *
   * @defaultValue 12
   */
  strokeWidth?: string | number;
}

/**
 * Defines a circular spinning loader animation.
 * @param  {string}         [className]           Loader class name
 * @param  {string}         [color]               Loader graphic color
 * @param  {string|number}  [strokeWidth=12]      Stroke width to use for the loader's path
 */
export const RotatingLoader = ({
  className,
  color = themeVars.color.brand.default,
  strokeWidth = 12,
  ...props
}: RotatingLoaderProps) => (
  <svg
    className={classNames(rotatingLoader, className)}
    viewBox="0 0 100 100"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <title>Loading</title>
    <path
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeMiterlimit={12}
      fill="none"
      d="M9.8,50c0-22.2,18-40.2,40.2-40.2s40.2,18,40.2,40.2S72.2,90.2,50,90.2"
    />
  </svg>
);
