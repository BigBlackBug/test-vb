// Vendor
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { css } from '@emotion/css';
import { useSelector } from 'react-redux';

// App
import * as selectors from 'app/state/selectors/index.js';
import {
  useFontLibrariesForAccount,
  useFontLibrariesForBusiness,
  useGlobalFontLibraries,
} from 'app/models/fontLibraries/hooks';

// Shared
import { CoreBusinessDetails } from 'shared/api/graphql/businesses/fragments';

// Editor
import FontLibraryFontList from 'editor/components/FontLibraryFontList';
import FontLibrarySectionHeading from 'editor/components/FontLibrarySectionHeading';
import { BusinessFontLibrarySection } from 'editor/components/EditBusinessProfileFontsControlPanel';

// Local
import { RotatingLoader } from '@libs/shared-ui-components/src';
import { makeIntersectionObserver } from 'app/hooks/element';
import { ASSET_DROPZONE_ID } from './constants';
import { useIsWindowMobile } from 'app/hooks/windowBreakpoint';
import Font from 'app/models/fontLibraries/Font';

interface BrandModalFontsLibraryPanelProps {
  // Details of the business for the font library
  businessDetails: CoreBusinessDetails;
}

export default function BrandModalFontsLibraryPanel({
  businessDetails,
}: BrandModalFontsLibraryPanelProps) {
  const accountGUID = useSelector(selectors.getAccountGUID);

  const { businessName, guid: businessGUID } = businessDetails;
  const { businessFontLibraries, isLoading: isLoadingBusinessFontLibraries } =
    useFontLibrariesForBusiness(businessGUID as string);
  const { accountFontLibraries, isLoading: isLoadingAccountFontLibraries } =
    useFontLibrariesForAccount(accountGUID);
  const { globalFontLibraries, isLoading: isLoadingGlobalFontLibraries } =
    useGlobalFontLibraries(false);

  // Flatten the business font libraries into a single array of fonts

  const businessFontLibraryFonts = useMemo(
    () => businessFontLibraries[0]?.assets ?? [],
    [businessFontLibraries],
  );

  const hasStaticFonts = useMemo(
    () => [...accountFontLibraries, ...globalFontLibraries].find(({ assets }) => assets.length > 0),
    [accountFontLibraries, globalFontLibraries],
  );

  const getIsFontSaved = useCallback(
    (font) => Boolean(businessFontLibraryFonts.find(({ bfsUUID }) => bfsUUID === font.bfsUUID)),
    [businessFontLibraryFonts],
  );

  // Add or removed font from business's "favorite" list
  const toggleIsFontSaved = (font: Font, isCurrentlySaved: boolean) => {
    if (isCurrentlySaved) {
      businessFontLibraries[0].removeFont(font);
    } else {
      businessFontLibraries[0].addFont(font);
    }
  };

  const isMobile = useIsWindowMobile();

  // Create an IntersectionObserver which will be able to detect the visibility of the panel's contents.
  // This can be used to help lazy-load panel contents (ie, large numbers of images).
  // It's recommended that this be used with the useIsElementInViewport hook.
  const [panelContentIntersectionObserver, setPanelContentIntersectionObserver] =
    useState<IntersectionObserver | null>(null);

  useEffect(() => {
    // Creating the IntersectionObserver in an effect so we can make sure the controls wrapper element has been rendered
    setPanelContentIntersectionObserver(
      makeIntersectionObserver({
        // If on mobile, editor control scrolling is done relative to the whole page so
        // set the root to null to check intersection relative to the whole viewport.
        // However on desktop, only the control panel on the side is scrollable, so we should
        // observe intersection relative to the control panel element instead.
        root: isMobile ? null : document.getElementById(ASSET_DROPZONE_ID),
        rootMargin: '20%',
      }),
    );
  }, [isMobile]);

  return (
    <>
      {/* Show a loading state if we're waiting for font libraries to finish loading */}
      {isLoadingBusinessFontLibraries ||
      isLoadingAccountFontLibraries ||
      isLoadingGlobalFontLibraries ? (
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
            businessFontLibrary={businessFontLibraries[0]}
            businessFontLibraryFonts={businessFontLibraryFonts}
          />

          {/* Ensure the global font libraries have loaded before displaying their fonts */}
          {hasStaticFonts ? (
            <>
              <FontLibrarySectionHeading headingText="All fonts" />
              {[...accountFontLibraries, ...globalFontLibraries].map(
                ({ guid, displayName, assets }) => (
                  <FontLibraryFontList
                    key={guid}
                    fonts={assets}
                    shouldIncludeSaveToLibraryButton
                    onClickToggleIsFontSaved={toggleIsFontSaved}
                    getIsFontSaved={getIsFontSaved}
                    fontLibraryName={displayName}
                    lazyLoadIntersectionObserver={panelContentIntersectionObserver}
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
