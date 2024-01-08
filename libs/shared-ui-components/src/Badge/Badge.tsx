// Vendor
import * as styles from './Badge.css';
import { buttonStyleVariants } from '@libs/shared-ui-styles/src';
import classNames from 'classnames';

interface BadgeProps {
  /** The name of them class to apply to the badge */
  className?: string;
  /** The name of them class to apply to the badge */
  colorTheme?: keyof typeof buttonStyleVariants | null;
  /** Content of the badge */
  badgeText: string;
}

/**
 * A badge is a small component that can be used to display a short piece of information, such as a number or a word.
 * @param colorTheme The name of them class to apply to the badge
 * @param children Content of the badge
 * @example
 * <Badge colorTheme="primary">New</Badge>
 */
const Badge = ({ colorTheme = null, badgeText, className }: BadgeProps) => {
  return (
    <div
      className={classNames(
        styles.Badge,
        colorTheme ? buttonStyleVariants[colorTheme] : null,
        className,
      )}
    >
      {badgeText}
    </div>
  );
};

export default Badge;
