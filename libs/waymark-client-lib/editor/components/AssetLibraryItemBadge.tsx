// Vendor
import classNames from 'classnames';

// Styles
import * as styles from './AssetLibraryItemBadge.css';

interface AssetLibraryItemBadgeProps {
  /**
   * Class name to apply additional custom styles to the badge element
   */
  className?: string | null;
  /**
   * The content to display inside the badge
   */
  children: React.ReactNode;
}

/**
 * Provides a pre-styled wrapper for badges which can be displayed in the bottom left corner of an asset
 * to indicate things like whether the asset is being used in the template.
 * These badges should be passed to the AssetLibraryItemButton component's `overlayBadges` prop.
 */
export const AssetLibraryItemBadge = ({
  className = null,
  children,
  ...props
}: AssetLibraryItemBadgeProps) => (
  <div className={classNames(styles.AssetLibraryItemBadge, className)} {...props}>
    {children}
  </div>
);
