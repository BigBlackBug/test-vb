import _ from 'lodash';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { CoreBusinessDetails } from 'shared/api/graphql/businesses/fragments';
import { useAllBusinessesForAccount } from 'shared/api/graphql/businesses/queries';
import * as selectors from 'app/state/selectors/index.js';

/**
 * Hook returns a boolean indicating whether the currently logged-in account has
 * reached the maximum number of saved businesses.
 */
export const useHasReachedMaxBrandCount = () => {
  const { businesses, isLoading } = useAllBusinessesForAccount();
  const maxSavedBrandCount = useSelector(selectors.maxSavedBrandCount);

  const brandCount = businesses ? businesses.length : 0;

  const hasReachedMaxSavedBrandCount =
    businesses && maxSavedBrandCount != null ? maxSavedBrandCount <= brandCount : false;

  return {
    brandCount,
    hasReachedMaxSavedBrandCount,
    isLoading,
  };
};

interface MissingBusinessDetails {
  isMissingName: boolean;
  isMissingAbout: boolean;
  isMissingLogo: boolean;
  isMissingImages: boolean;
  isMissingColors: boolean;
  isInvalid: boolean;
}

// hook that takes businessDetails and returns an object showing if the specified fields are missing
export const useMissingBusinessFields = (
  businessDetails?: CoreBusinessDetails | null,
): MissingBusinessDetails => {
  const missingDetails: MissingBusinessDetails = useMemo(() => {
    if (!businessDetails) {
      return {
        isMissingName: false,
        isMissingAbout: false,
        isMissingLogo: false,
        isMissingImages: false,
        isMissingColors: false,
        isInvalid: false,
      };
    }

    const { businessName, businessAbout, logoImage, totalImageCount, colorLibraries } =
      businessDetails;

    const brandColors: string[] =
      colorLibraries?.edges[0]?.node.colors.edges.map(({ node: { hexCode } }) => hexCode) ?? [];

    const isMissingName = !businessName;
    const isMissingAbout = !businessAbout;
    const isMissingLogo = logoImage == null;
    const isMissingImages = !totalImageCount || totalImageCount < 10;
    const isMissingColors = _.isEmpty(brandColors);

    return {
      isMissingName,
      isMissingAbout,
      isMissingLogo,
      isMissingImages,
      isMissingColors,
      isInvalid:
        isMissingName || isMissingAbout || isMissingLogo || isMissingImages || isMissingColors,
    };
  }, [businessDetails]);

  return missingDetails;
};
