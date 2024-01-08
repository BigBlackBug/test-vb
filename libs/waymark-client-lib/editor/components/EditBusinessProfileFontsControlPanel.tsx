// Vendor
import _ from 'lodash';
import { useCallback, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { css } from '@emotion/css';

// Editor
import makeEditorControlPanel from 'editor/components/panels/utils/makeEditorControlPanel';
import BaseHeaderBackButton from 'editor/components/BaseHeaderBackButton';
import { EditorControlPanelHeading } from 'editor/components/EditorControlHeadings';
import { useEditorMediaLibraries } from 'editor/providers/EditorMediaLibrariesProvider.js';
import FontLibraryFontList from 'editor/components/FontLibraryFontList';
import FontLibrarySectionHeading from 'editor/components/FontLibrarySectionHeading';
import BusinessFontLibrary from 'app/models/fontLibraries/BusinessFontLibrary';
import Font from 'app/models/fontLibraries/Font';
import { useEditorState } from 'editor/providers/EditorStateProvider.js';

// App
import ToggleCollapseTransition from 'app/components/ToggleCollapseTransition';

// Shared
import { RotatingLoader } from '@libs/shared-ui-components';
import { useEditorPanelContentIntersectionObserver } from 'editor/providers/EditorPanelProvider';

function EditBusinessProfileFontsHeader() {
  return <BaseHeaderBackButton />;
}

/**
 * Displays a heading and a list of fonts in a BusinessFontLibrary instance
 */

interface BusinessFontLibrarySectionProps {
  /** The font library whose fonts we should display */
  businessFontLibrary: BusinessFontLibrary;
  /** List of fonts in the font library */
  businessFontLibraryFonts: Font[];
  /** Heading to display at the top of the section (heading will be hidden if the library is empty) */
  sectionHeading: string;
  lazyLoadIntersectionObserver?: IntersectionObserver | null;
}

export function BusinessFontLibrarySection({
  businessFontLibrary,
  businessFontLibraryFonts,
  sectionHeading,
  lazyLoadIntersectionObserver,
}: BusinessFontLibrarySectionProps) {
  return (
    <>
      {/* If the font library doesn't have any fonts, collapse the heading */}
      <ToggleCollapseTransition isVisible={!_.isEmpty(businessFontLibraryFonts)}>
        <FontLibrarySectionHeading headingText={sectionHeading} />
        {businessFontLibrary ? (
          <FontLibraryFontList
            className={css`
              margin-bottom: 52px;
            `}
            fonts={businessFontLibraryFonts}
            shouldIncludeSaveToLibraryButton
            onClickToggleIsFontSaved={(font) => businessFontLibrary.removeFont(font)}
            // All fonts in the business font library are saved
            getIsFontSaved={() => true}
            fontLibraryName={businessFontLibrary.displayName}
            lazyLoadIntersectionObserver={lazyLoadIntersectionObserver}
          />
        ) : null}
      </ToggleCollapseTransition>
    </>
  );
}
BusinessFontLibrarySection.propTypes = {
  businessFontLibrary: PropTypes.instanceOf(BusinessFontLibrary).isRequired,
  businessFontLibraryFonts: PropTypes.arrayOf(PropTypes.instanceOf(Font)).isRequired,
  sectionHeading: PropTypes.string.isRequired,
};

/**
 * Renders controls for viewing and editing a business profile's font library
 */
function EditBusinessProfileFontsControls() {
  const {
    font: {
      setShouldLoadFontLibraries,
      editingBusinessFontLibraries,
      accountGroupFontLibraries,
      globalFontLibraries,
      isLoadingFonts,
    },
  } = useEditorMediaLibraries();

  const { editingBusinessDetails } = useEditorState();
  const businessName = editingBusinessDetails?.businessName;

  useEffect(() => {
    setShouldLoadFontLibraries(true);

    return () => setShouldLoadFontLibraries(false);
  }, [setShouldLoadFontLibraries]);

  const [defaultBusinessFontLibrary] = editingBusinessFontLibraries;

  const businessFontLibraryFonts = useMemo(
    () => defaultBusinessFontLibrary?.assets ?? [],
    [defaultBusinessFontLibrary?.assets],
  );

  const getIsFontSaved = useCallback(
    (font: Font) =>
      Boolean(businessFontLibraryFonts.find(({ bfsUUID }: Font) => bfsUUID === font.bfsUUID)),
    [businessFontLibraryFonts],
  );

  // Add or removed font from business's "favorite" list
  const toggleIsFontSaved = (font: Font, isCurrentlySaved: boolean) => {
    if (isCurrentlySaved) {
      defaultBusinessFontLibrary.removeFont(font);
    } else {
      defaultBusinessFontLibrary.addFont(font);
    }
  };

  const hasStaticFonts = useMemo(
    () =>
      [...accountGroupFontLibraries, ...globalFontLibraries].find(
        ({ assets }) => assets.length > 0,
      ),
    [accountGroupFontLibraries, globalFontLibraries],
  );

  const panelContentIntersectionObserver = useEditorPanelContentIntersectionObserver();

  return (
    <>
      <EditorControlPanelHeading
        heading="Brand fonts"
        subheading={`Save fonts for ${businessName || 'your brand'} for easy use in videos.`}
      />
      {/* Show a loading state if we're waiting for font libraries to finish loading */}
      {isLoadingFonts ? (
        <RotatingLoader
          className={css`
            width: 64px;
            height: 64px;
            margin: 16px auto;
            display: block !important;
          `}
        />
      ) : (
        <>
          <BusinessFontLibrarySection
            sectionHeading={`${businessName || 'Brand'} fonts`}
            businessFontLibrary={defaultBusinessFontLibrary}
            businessFontLibraryFonts={businessFontLibraryFonts}
            lazyLoadIntersectionObserver={panelContentIntersectionObserver}
          />

          {/* Ensure the global font libraries have loaded before displaying their fonts */}
          {hasStaticFonts ? (
            <>
              <FontLibrarySectionHeading headingText="All fonts" />
              {[...accountGroupFontLibraries, ...globalFontLibraries].map(
                ({ guid, displayName, assets }) => (
                  <FontLibraryFontList
                    key={guid}
                    fonts={assets}
                    shouldIncludeSaveToLibraryButton
                    onClickToggleIsFontSaved={toggleIsFontSaved}
                    getIsFontSaved={getIsFontSaved}
                    fontLibraryName={displayName}
                  />
                ),
              )}
            </>
          ) : null}
        </>
      )}
    </>
  );
}

export default makeEditorControlPanel(
  EditBusinessProfileFontsHeader,
  EditBusinessProfileFontsControls,
);
