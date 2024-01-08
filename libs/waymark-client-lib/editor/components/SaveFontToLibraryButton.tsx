// Vendor
import { useMemo } from 'react';

// Editor
import Font from 'app/models/fontLibraries/Font';

// Shared
import { WaymarkButton } from 'shared/components/WaymarkButton';

// App
import { HeartIcon } from 'app/icons/ToolsAndActionsIcons';

// Styles
import * as styles from './SaveFontToLibraryButton.css';

interface SaveFontToLibraryButtonProps {
  /**
   * The font which this button will save/unsave
   */
  font: Font;
  /**
   * Callback function to toggle whether the font is saved when the button is clicked
   */
  onClickToggleIsFontSaved?: (font: Font, isFontSaved: boolean) => void;
  /**
   * Function takes the font and returns whether it's currently saved
   */
  getIsFontSaved?: (font: Font) => boolean;
}

/**
 * Heart icon button which can be clicked to toggle whether a font is in a font library or not
 */
export function SaveFontToLibraryButton({
  font,
  onClickToggleIsFontSaved,
  getIsFontSaved,
}: SaveFontToLibraryButtonProps) {
  const isFontSaved = useMemo(() => getIsFontSaved?.(font) ?? false, [getIsFontSaved, font]);

  return (
    <WaymarkButton onClick={() => onClickToggleIsFontSaved?.(font, isFontSaved)}>
      <HeartIcon
        fillColor={isFontSaved ? '#ec4f27' : 'none'}
        strokeColor={isFontSaved ? 'none' : undefined}
        className={styles.HeartIcon}
      />
    </WaymarkButton>
  );
}
