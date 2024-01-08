/* eslint-disable @typescript-eslint/no-empty-function */
// Vendor
import _ from 'lodash';

// Editor
import Font from 'app/models/fontLibraries/Font';

// Shared
import { WaymarkButton } from 'shared/components/WaymarkButton';
import AnimatedCollapseTransitionList from 'shared/components/AnimatedCollapseTransitionList';
import BitmapFontPreview from 'shared/components/BitmapFontPreview';

// Local
import { SaveFontToLibraryButton } from './SaveFontToLibraryButton';

// Styles
import * as styles from './FontLibraryFontList.css';

/**
 * Main contents displaying a bitmap font preview for a font + its font library name
 *
 * @param {string}  fontVariantUUID   UUID for the font variant to use for our preview image
 * @param {string}  fontDisplayName   Display name representing the font
 * @param {string}  [fontLibraryName] Display name representing the font library that the font belongs to
 * @param {Object}  [lazyLoadIntersectionObserver]  IntersectionObserver instance to use for lazy loading the font preview image
 */

export interface MainFontItemContentsProps {
  fontVariantUUID: string;
  fontDisplayName: string;
  fontLibraryName?: string | null;
  lazyLoadIntersectionObserver?: IntersectionObserver | null;
}

function MainFontItemContents({
  fontVariantUUID,
  fontDisplayName,
  fontLibraryName = null,
  lazyLoadIntersectionObserver,
}: MainFontItemContentsProps) {
  return (
    <>
      <BitmapFontPreview
        fontVariantUUID={fontVariantUUID}
        text={fontDisplayName}
        shouldLazyLoad
        lazyLoadIntersectionObserver={lazyLoadIntersectionObserver}
      />
      {fontLibraryName ? <div className={styles.FontLibraryName}>{fontLibraryName}</div> : null}
    </>
  );
}

/**
 * Renders a list item for a font library font
 *
 * @param {Font}    font                                      A Font instance which we should render a list item for
 * @param {string | null}  [fontLibraryName]                         The name of the font library that the font belongs to
 * @param {Object}  [currentTypography]                       Data from the configuration describing the font that's currently selected in the video
 * @param {boolean} [isSelectable=false]                      Whether the font list item should be "selectable", meaning it acts as a button which will
 *                                                              call onSelectFont when clicked
 * @param {func}    [onSelectFont]                            Callback function to call when the font list item is clicked, if isSelectable is true
 * @param {boolean} [shouldIncludeSaveToLibraryButton=false]  Whether the font list item should include a heart icon button which will
 *                                                              call onClickToggleIsFontSaved when clicked
 * @param {func}    [onClickToggleIsFontSaved]                Callback function to call to toggle whether a font is saved to a font library or not,
 *                                                               if shouldIncludeSaveToLibraryButton is true
 * @param {func}    [getIsFontSaved]                          Function takes this list item's Font and returns whether it's saved to a font library,
 *                                                               if shouldIncludeSaveToLibraryButton is true
 * @param {IntersectionObserver} [lazyLoadIntersectionObserver]  IntersectionObserver instance to use for lazy loading the font preview image
 */

interface FontLibraryListItemProps {
  font: Font;
  fontLibraryName?: string | null;
  currentTypography?: {
    fontFamily: string;
    fontVariantUUID: string;
  };
  isSelectable?: boolean;
  onSelectFont?: (font: Font) => void;
  shouldIncludeSaveToLibraryButton?: boolean;
  onClickToggleIsFontSaved?: (font: Font, isCurrentlySaved: boolean) => void;
  getIsFontSaved?: (font: Font) => boolean;
  lazyLoadIntersectionObserver?: IntersectionObserver | null;
}
function FontLibraryListItem({
  font,
  fontLibraryName,
  currentTypography,
  isSelectable,
  onSelectFont,
  shouldIncludeSaveToLibraryButton,
  onClickToggleIsFontSaved,
  getIsFontSaved,
  lazyLoadIntersectionObserver,
}: FontLibraryListItemProps) {
  // Don't render this font if it doesn't have any variants due to some configuration error
  if (_.isEmpty(font.variants)) {
    return null;
  }

  let isSelected = false;

  if (isSelectable) {
    // If the selected variant is included in one of the font's variant options, we consider it selected
    isSelected = currentTypography
      ? font.fontFamily === currentTypography.fontFamily ||
        Boolean(font.getVariantByUUID(currentTypography.fontVariantUUID))
      : false;
  }

  const { displayName, defaultFontVariant } = font;

  const fontItemContents = (
    <MainFontItemContents
      fontVariantUUID={defaultFontVariant.uuid}
      fontDisplayName={displayName}
      fontLibraryName={fontLibraryName}
      lazyLoadIntersectionObserver={lazyLoadIntersectionObserver}
    />
  );

  return (
    <div className={styles.FontListItem} {...styles.dataIsSelected(isSelected)}>
      {isSelectable ? (
        // If the item is selectable, wrap the main contents in a button which
        // will call `onSelectFont` when clicked
        <WaymarkButton
          onClick={() => onSelectFont?.(font)}
          isDisabled={!isSelectable}
          isUppercase={false}
          hasFill={false}
          className={styles.FontItemContentsWrapper}
        >
          {fontItemContents}
        </WaymarkButton>
      ) : (
        // If the item is not selectable, just wrap the contents in a div
        <div className={styles.FontItemContentsWrapper}>{fontItemContents}</div>
      )}
      {shouldIncludeSaveToLibraryButton ? (
        <SaveFontToLibraryButton
          font={font}
          onClickToggleIsFontSaved={onClickToggleIsFontSaved}
          getIsFontSaved={getIsFontSaved}
        />
      ) : null}
    </div>
  );
}

/**
 * Renders a list of fonts from a font library
 *
 * @param {Font[]}  fonts                                     A list of Font instances which we should render
 * @param {Object}  [currentTypography]                       Data from the configuration describing the font that's currently selected in the video
 * @param {boolean} [isSelectable=false]                      Whether the font list items should be "selectable", meaning they act as a button which will
 *                                                              call onSelectFont when clicked
 * @param {func}    [onSelectFont]                            Callback function to call when a selectable font list item is clicked
 *                                                              (This is only relevant if isSelectable is enabled)
 * @param {boolean} [shouldIncludeSaveToLibraryButton=false]  Whether the font list items should include a heart icon button which will
 *                                                              call onClickToggleIsFontSaved when clicked
 * @param {func}    [onClickToggleIsFontSaved]                Callback function to call to toggle whether a font is saved to a font library or not
 *                                                              (This is only relevant if shouldIncludeSaveToLibraryButton is enabled)
 * @param {func}    [getIsFontSaved]                          Function takes a font and returns whether that font is saved to a font library
 *                                                              (This is only relevant if shouldIncludeSaveToLibraryButton is enabled)
 * @param {string | null}  [fontLibraryName]                       The name of the font library that the fonts belong to
 * @param {string}  [className]
 * @param {IntersectionObserver} [lazyLoadIntersectionObserver]  IntersectionObserver instance to use for lazy loading the font preview image
 */

interface FontLibraryFontListProps {
  fonts: Font[];
  currentTypography?: {
    fontFamily: string;
    fontVariantUUID: string;
  };
  isSelectable?: boolean;
  onSelectFont?: (font: Font) => void;
  shouldIncludeSaveToLibraryButton?: boolean;
  onClickToggleIsFontSaved?: (font: Font, isCurrentlySaved: boolean) => void;
  getIsFontSaved?: (font: Font) => boolean;
  fontLibraryName?: string | null;
  className?: string;
  lazyLoadIntersectionObserver?: IntersectionObserver | null;
}
export default function FontLibraryFontList({
  fonts,
  currentTypography,
  isSelectable,
  onSelectFont,
  shouldIncludeSaveToLibraryButton,
  onClickToggleIsFontSaved,
  getIsFontSaved,
  fontLibraryName,
  className,
  lazyLoadIntersectionObserver,
}: FontLibraryFontListProps) {
  return (
    // The font list is animated so that list items expand/collapse when added/removed
    <AnimatedCollapseTransitionList
      className={className}
      listItems={fonts}
      getKeyForItem={(font) => font.guid}
      renderListItem={(font) => (
        <FontLibraryListItem
          font={font}
          currentTypography={currentTypography}
          isSelectable={isSelectable}
          onSelectFont={onSelectFont}
          shouldIncludeSaveToLibraryButton={shouldIncludeSaveToLibraryButton}
          onClickToggleIsFontSaved={onClickToggleIsFontSaved}
          getIsFontSaved={getIsFontSaved}
          fontLibraryName={fontLibraryName}
          lazyLoadIntersectionObserver={lazyLoadIntersectionObserver}
        />
      )}
    />
  );
}
