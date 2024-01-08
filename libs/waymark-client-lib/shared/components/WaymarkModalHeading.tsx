// Vendor
import classNames from 'classnames';

// Styles
import * as styles from './WaymarkModalHeading.css';

interface WaymarkModalHeadingProps {
  /** Primary header title text */
  title?: string | React.ReactNode;
  /** Secondary smaller text under the heading */
  subText?: string | React.ReactNode;
  /** Optional class name to apply custom styling to the heading */
  className?: string | null;
  /** Optional class name to apply to the title element */
  titleClassName?: string | null;
  /** Optional class name to apply to the subtext element */
  subTextClassName?: string | null;
  /** Optional ID to apply to the title element; this is mainly useful
   * so we can set this ID on the modal's aria-labelledby attribute for screen reader accessibility */
  titleID?: string | undefined;
  /** Optional ID to apply to the subtext element; this is mainly useful
   * so we can set this ID on the modal's aria-describedby attribute for screen reader accessibility */
  subTextID?: string | undefined;
}

/**
 * Reusable component for standardized styling of header text on modals
 */
const WaymarkModalHeading = ({
  title = null,
  subText = null,
  className = null,
  titleClassName = null,
  subTextClassName = null,
  titleID = undefined,
  subTextID = undefined,
  ...props
}: WaymarkModalHeadingProps) => {
  return (
    <div className={classNames(styles.Container, className)} {...props}>
      <div>
        {title && (
          <h3
            className={classNames(styles.Title, titleClassName)}
            id={titleID}
            data-testid="waymarkModalHeading"
          >
            {title}
          </h3>
        )}
        {subText && (
          <p
            className={classNames(styles.SubText, subTextClassName)}
            id={subTextID}
            data-testid="waymarkModalSubtext"
          >
            {subText}
          </p>
        )}
      </div>
    </div>
  );
};

export default WaymarkModalHeading;
