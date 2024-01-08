// Vendor
import classNames from 'classnames';

// Styles
import * as styles from './FontLibrarySectionHeading.css';

interface FontLibrarySectionHeadingProps {
  /**
   * The text to display in the heading
   */
  headingText: string;
  /**
   * Class name to apply custom styles to the element
   */
  className?: string;
}

/**
 * Heading text to display at the top of a section in the user's font library
 */
export default function FontLibrarySectionHeading({
  headingText,
  className,
}: FontLibrarySectionHeadingProps) {
  return <h2 className={classNames(styles.FontLibrarySectionHeading, className)}>{headingText}</h2>;
}
