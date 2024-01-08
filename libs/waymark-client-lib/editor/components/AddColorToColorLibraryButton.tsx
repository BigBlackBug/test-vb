// Vendor
import { useState } from 'react';

// Editor
import EditorCustomColorForm from 'editor/components/EditorCustomColorForm.js';
import EditableColorLibrary from 'app/models/colorLibraries/BaseEditableColorLibrary';

// Shared
import { WaymarkButton } from 'shared/components/WaymarkButton';

/* WAYMARK APP DEPENDENCIES */
import { AddIcon } from 'app/icons/BasicIcons';
import ToggleCollapseTransition from 'app/components/ToggleCollapseTransition';
/* END WAYMARK APP DEPENDENCIES */

import * as styles from './AddColorToColorLibraryButton.css';
import classNames from 'classnames';

interface AddColorToColorLibraryButtonProps {
  /**
   * The ColorLibrary instance which we want to add a color to
   */
  colorLibrary?: EditableColorLibrary;
  /**
   * If provided, this callback will be called with the hex code the user selected
   * when they add a new color to their library. This can be used to automatically select
   * the newly added color in the editor
   */
  onSelectLibraryColor?: (hexCode: string) => void;
  /**
   * The hex code that the form input should be populated with by default
   * @default null
   */
  defaultHexCode?: string | null;
  /**
   * Additional class names to apply to the button
   * @default null
   * */
  className?: string | null;
}

/**
 * Renders a button which, when clicked, will reveal a form that allows the user to select a color hex code and
 * add it to their color library
 *
 * @param {ColorLibrary}  colorLibrary  The ColorLibrary instance which we want to add a color to
 * @param {func}  [onSelectLibraryColor]  If provided, this callback will be called with the hex code the user selected
 *                                        when they add a new color to their library. This can be used to automatically select
 *                                        the newly added color in the editor
 * @param {string}  [defaultHexCode]   The hex code that the form input should be populated with by default
 */
export default function AddColorToColorLibraryButton({
  colorLibrary,
  onSelectLibraryColor,
  defaultHexCode = null,
  className = null,
}: AddColorToColorLibraryButtonProps) {
  const [isAddingColor, setIsAddingColor] = useState(false);

  return (
    <>
      {/* Button expands custom color form or intercepts with login modal if the
                user is not logged in */}
      <WaymarkButton
        className={classNames(styles.AddColorToColorLibraryButton, className)}
        {...styles.dataIsColorFormExpanded(isAddingColor)}
        hasFill={false}
        tooltipText={isAddingColor ? 'Cancel' : 'Add custom color'}
        // Toggle the color form open/closed
        onClick={() => setIsAddingColor((currentIsAddingColor) => !currentIsAddingColor)}
      >
        <AddIcon />
      </WaymarkButton>
      <ToggleCollapseTransition
        isVisible={isAddingColor}
        className={styles.CollapsibleColorFormSection}
        duration={150}
      >
        {/* Custom color form is collapsed by default and expanded when the user starts adding a color */}
        <EditorCustomColorForm
          onSubmitCustomColor={(hexCode) => {
            colorLibrary?.addColor(hexCode);
            onSelectLibraryColor?.(hexCode);
            setIsAddingColor(false);
          }}
          defaultHexCode={defaultHexCode || ''}
        />
      </ToggleCollapseTransition>
    </>
  );
}
