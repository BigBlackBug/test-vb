// Vendor
import { useEditorLongPressModal } from 'editor/providers/EditorLongPressModalProvider.js';

// Shared
import { WaymarkButton, WaymarkButtonProps } from 'shared/components/WaymarkButton';

/* WAYMARK APP DEPENDENCIES */
import { CloseIcon } from 'app/icons/BasicIcons';
/* END WAYMARK APP DEPENDENCIES */

import * as styles from './ColorLibraryListItem.css';

interface ColorLibraryListItemProps {
  /**
   * Hex code of the color
   */
  hexCode: string;
  /**
   * Name to use in tooltips to describe the color, if applicable
   */
  displayName: string;
  /**
   * Whether this color is currently being used for the currently selected color field
   * @default false
   */
  isSelected?: boolean;
  /**
   * Selects the color to use in the video for the currently selected color field
   */
  onSelectLibraryColor?: (hexCode: string) => void;
  /**
   * Deletes the color from its ColorLibrary
   */
  removeColorFromLibrary?: () => void;
}

/**
 * An item in a static color library, ie an account group color library or the generated basic color library
 *
 * @param {string}  hexCode         Hex code of the color
 * @param {string}  displayName     Name to use in tooltips to describe the color, if applicable
 * @param {bool}    [isSelected=false]  Whether this color is currently being used for the currently selected color field
 * @param {func}    [onSelectLibraryColor]  Selects the color to use in the video for the currently selected color field
 * @param {func}    [removeColorFromLibrary]  Deletes the color from its ColorLibrary
 */
export default function ColorLibraryListItem({
  hexCode,
  displayName,
  isSelected = false,
  onSelectLibraryColor,
  removeColorFromLibrary,
}: ColorLibraryListItemProps) {
  // If we have an `onSelectLibraryColor` function, enable controls to select this color
  const isSelectable = Boolean(onSelectLibraryColor);
  // If we have a `removeColorFromLibrary` function, enable controls to delete this color from its library
  const isRemovable = Boolean(removeColorFromLibrary);

  const { onItemTouchStart, onItemTouchEnd } = useEditorLongPressModal();

  return (
    <div className={styles.ListItemWrapper}>
      {isSelectable ? (
        <WaymarkButton
          {...styles.dataIsSelected(isSelected)}
          className={styles.ColorLibraryListItem}
          style={{
            backgroundColor: hexCode,
          }}
          hasFill={false}
          onClick={() => onSelectLibraryColor?.(hexCode)}
          onTouchStart={(event) => {
            const longPressModalActions: Array<{
              actionName: string;
              action: () => void;
              buttonProps?: Partial<WaymarkButtonProps>;
            }> = [
              {
                // "Select" button selects this color to use as the selected color field's new configuration value
                actionName: 'Select',
                action: () => onSelectLibraryColor?.(hexCode),
              },
            ];

            if (isRemovable && removeColorFromLibrary) {
              longPressModalActions.push({
                // "Remove" button deletes this color from the user's custom colors
                actionName: 'Remove',
                action: removeColorFromLibrary,
                buttonProps: {
                  // Make the button red to indicate it is a dangerous delete action
                  colorTheme: 'Negative',
                },
              });
            }

            onItemTouchStart(event, {
              // Along with our event object, we need to pass along a "long press action modal config" to define the appearance/contents of the modal that will open after the user performs
              // a long press on this button on a mobile device
              // For more details on this config, see EditorLongPressActionModal.js

              // We should display "Color actions" and a small circle previewing the color at the top of the modal
              title: (
                <>
                  Color actions{' '}
                  {/* Display a preview circle representing the selected color to take action for */}
                  <div
                    className={styles.ActionModalColorDot}
                    style={{
                      backgroundColor: hexCode,
                    }}
                  />
                </>
              ),
              actions: longPressModalActions,
            });
          }}
          onTouchEnd={onItemTouchEnd}
          tooltipText={`Use color ${displayName}`}
        />
      ) : (
        // If the color can't be selected, just render a basic div rather than a button
        <div
          className={styles.ColorLibraryListItem}
          style={{
            backgroundColor: hexCode,
          }}
        />
      )}
      {isRemovable ? (
        // Delete button is hidden unless the user is hovering over the item, in which case
        // it will appear as a small X in the top right corner of the library item circle
        <WaymarkButton
          onClick={removeColorFromLibrary}
          colorTheme="Tertiary"
          className={styles.DeleteButton}
          tooltipText={`Remove color ${displayName}`}
          hasFill={false}
        >
          <CloseIcon />
        </WaymarkButton>
      ) : null}
    </div>
  );
}
