// Vendor
import _ from 'lodash';
import { forwardRef } from 'react';
import Dotdotdot from 'react-dotdotdot';
import classNames from 'classnames';

// Editor
import { useEditorLongPressModal } from 'editor/providers/EditorLongPressModalProvider.js';

// Shared
import { WaymarkButton, WaymarkButtonProps } from 'shared/components/WaymarkButton';

// Waymark app dependencies
import { useIsWindowMobile } from 'app/hooks/windowBreakpoint.js';

import * as styles from './AssetLibraryItemButton.css';

interface AssetLibraryItemButtonProps extends WaymarkButtonProps {
  actionModalTitle?: string | null;
  toolbarButtons?: React.ReactNode;
  longPressModalActionConfigs?: Array<object | null>;
  overlayBadges?: React.ReactNode;
  isSelected?: boolean;
  assetDisplayName?: string | null;
  className?: string;
  children: React.ReactNode;
}
/**
 * Renders a button which provides a standardized UI for selecting/removing an item from the
 * image or video asset libraries
 *
 * @param {string}  [actionModalTitle]    Title to display on the mobile long press action modal for this item
 * @param {Node}    [toolbarButtons]      Button contents to display in the asset's hover toolbar. It's recommended to use the <AssetLibraryItemToolbarButton> component
 *                                          for each button for consistent styling.
 * @param {Object[]}  [longPressModalActionConfigs] Array of configurations for action buttons which should be shown
 *                                                  in the long-press action modal on mobile devices
 * @param {Node}    [overlayBadges]     Indicator badge contents to display in the bottom-left corner of the asset (ie, the "in use" badge).
 *                                        It's recommended to use the pre-styled AssetLibraryItemBadge component for these badges
 * @param {bool}    [isSelected]        Whether this item is currently selected for the form field being edited
 * @param {string}  [assetDisplayName]  Optional display name to show as a label under the asset
 * @param {func}    [onClick]           Callback to run when the main asset button is clicked
 */
export const AssetLibraryItemButton = forwardRef<HTMLDivElement, AssetLibraryItemButtonProps>(
  (
    {
      actionModalTitle = null,
      toolbarButtons = null,
      longPressModalActionConfigs = [],
      overlayBadges = null,
      isSelected = false,
      assetDisplayName = null,
      className = undefined,
      children,
      ...props
    }: AssetLibraryItemButtonProps,
    ref,
  ) => {
    const isMobile = useIsWindowMobile();

    const { onItemTouchStart, onItemTouchEnd } = useEditorLongPressModal();

    return (
      <div ref={ref} className={classNames(styles.AssetLibraryItemButtonWrapper, className)}>
        <WaymarkButton
          className={styles.AssetLibraryItemButton}
          colorTheme={isSelected ? 'Primary' : 'Secondary'}
          isUppercase={false}
          onTouchStart={
            !_.isEmpty(longPressModalActionConfigs)
              ? (event) => {
                  onItemTouchStart(event, {
                    // Set the title to display at the top of the modal
                    title: actionModalTitle,
                    // Configs for action buttons to display in the modal
                    actions: longPressModalActionConfigs,
                  });
                }
              : undefined
          }
          onTouchEnd={onItemTouchEnd}
          {...props}
        >
          {children}
        </WaymarkButton>
        {/* If on desktop, render a "toolbar" in the top right corner of the asset
              with any applicable action buttons (ie, "remove", "use as logo") */}
        {!isMobile && !_.isEmpty(toolbarButtons) ? (
          <div className={styles.AssetLibraryItemToolbar}>{toolbarButtons}</div>
        ) : null}
        {/* If any overlay badges were provided, display them in the bottom left corner of the asset */}
        {overlayBadges ? <div className={styles.OverlayBadgeWrapper}>{overlayBadges}</div> : null}
        {assetDisplayName && (
          // Dotdotdot component allows us to let the display name take up to 2 lines and then show
          // a truncated "..." at the end if it would otherwise overflow into a 3rd line
          <Dotdotdot clamp={2}>
            <p className={styles.AssetName} title={assetDisplayName}>
              {assetDisplayName}
            </p>
          </Dotdotdot>
        )}
      </div>
    );
  },
);
