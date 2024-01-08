// Vendor
import _ from 'lodash';
import { useMemo } from 'react';
import { useQuery } from '@apollo/client';

// Local
import AccountImageLibrary from './AccountImageLibrary';
import BusinessImageLibrary from './BusinessImageLibrary';
import StaticImageLibrary from './StaticImageLibrary';
import {
  accountImageLibraryQuery,
  AccountImageLibraryQueryResult,
  businessImageLibraryQuery,
  BusinessImageLibraryQueryResult,
} from './queries';
import { getImageLibraryDataFromNode } from './utils';

/**
 * Hook fetches and parses image library data for a given account and any of that account's account groups.
 *
 * @param {string} accountGUID    GUID of account to fetch image library data for
 * @param {bool}  [shouldIncludePlaceholderLibrary=true]  Whether to include a placeholder library if the user isn't logged in or doesn't have an existing account library
 */
export const useAccountAndAccountGroupImageLibraries = (
  accountGUID: string,
  shouldIncludePlaceholderAccountLibrary = true,
) => {
  const { data: queryData, loading: isLoading } = useQuery<AccountImageLibraryQueryResult>(
    accountImageLibraryQuery,
    {
      variables: {
        accountGUID,
      },
      skip: !accountGUID,
      // The first time that this hook is run, make sure we call out to the server to ensure
      // our image library data is in sync with what's in the DB
      fetchPolicy: 'network-only',
      // On subsequent re-runs of this hook, prefer to use data in the apollo cache
      nextFetchPolicy: 'cache-first',
    },
  );

  const accountData = queryData?.accountByGuid;

  // Create AccountImageLibrary model instances for the account's libraries
  const accountImageLibraries = useMemo(() => {
    const imageLibraries: Array<AccountImageLibrary> = [];

    const accountDisplayName = accountData?.displayName;

    const accountImageLibraryName = accountDisplayName
      ? `${accountDisplayName}'s Images`
      : 'My Images';

    if (accountData) {
      const rawAccountImageLibraryData = accountData?.imageLibraries;

      if (rawAccountImageLibraryData) {
        rawAccountImageLibraryData?.edges.forEach(({ node: imageLibraryNode }) => {
          const formattedImageLibraryData = getImageLibraryDataFromNode(imageLibraryNode);
          imageLibraries.push(
            new AccountImageLibrary({
              ...formattedImageLibraryData,
              // The display name on account image libraries from the DB
              // can get stale very easily, so we should just override it with
              // what we know to be a reasonable library name
              displayName: accountImageLibraryName,
              accountGUID,
            }),
          );
        });
      }
    }

    if (_.isEmpty(imageLibraries) && shouldIncludePlaceholderAccountLibrary) {
      // If the user isn't logged in or the account doesn't have any image libraries, create a placeholder
      // which we can use if the user tries to save an image for the first time.
      // Note that we're including the state where the user is not logged in, because we want to
      // be able to show a placeholder library with an upload button in the UI which will force the user to
      // log in before they can save an image
      imageLibraries.push(
        new AccountImageLibrary({
          displayName: accountImageLibraryName,
          slug: null,
          images: [],
          removedImages: [],
          accountGUID,
        }),
      );
    }

    return imageLibraries;
  }, [accountData, accountGUID, shouldIncludePlaceholderAccountLibrary]);

  const accountGroupData = accountData?.accountGroups;

  // Create StaticImageLibrary model instances for the account group's libraries
  const accountGroupImageLibraries = useMemo(() => {
    const imageLibraries: Array<StaticImageLibrary> = [];

    if (accountGroupData) {
      accountGroupData.edges.forEach(({ node: accountGroupNode }) => {
        accountGroupNode.imageLibraries?.edges.forEach(({ node: accountGroupImageLibraryNode }) => {
          const formattedImageLibraryData = getImageLibraryDataFromNode(
            accountGroupImageLibraryNode,
          );
          imageLibraries.push(new StaticImageLibrary(formattedImageLibraryData));
        });
      });
    }

    return imageLibraries;
  }, [accountGroupData]);

  return {
    isLoading,
    accountImageLibraries,
    accountGroupImageLibraries,
  };
};

/**
 * Hook fetches and parses image library data for a given business
 *
 * @param {string} businessGUID    GUID of account to fetch image library data for
 * @param {bool}  [shouldIncludePlaceholderLibrary=true]  Whether to include a placeholder library if the business doesn't have an existing library
 */
export const useBusinessImageLibraries = (
  businessGUID: string | null,
  shouldIncludePlaceholderLibrary = true,
) => {
  const { data: queryData, loading: isLoading } = useQuery<BusinessImageLibraryQueryResult>(
    businessImageLibraryQuery,
    {
      variables: {
        businessGUID,
      },
      skip: !businessGUID,
    },
  );

  const businessData = queryData?.businessByGuid;

  // Create BusinessImageLibrary instances for each library in the business
  const businessImageLibraries = useMemo(() => {
    const imageLibraries: Array<BusinessImageLibrary> = [];

    if (businessData) {
      const businessName = businessData?.businessName;
      const rawBusinessImageLibraryData = businessData?.imageLibraries;

      const businessImageLibraryName = `${businessName || 'Brand'} Images`;

      const logoImageGUID = businessData.logoImage?.guid ?? null;

      rawBusinessImageLibraryData?.edges?.forEach(({ node }) => {
        const formattedImageLibraryData = getImageLibraryDataFromNode(node, logoImageGUID);
        imageLibraries.push(
          new BusinessImageLibrary({
            ...formattedImageLibraryData,
            // The display name on the business image library from the DB
            // can get stale very easily, so we should just override it with
            // what we know to be a reasonable library name
            displayName: businessImageLibraryName,
            businessGUID,
            logoImageGUID,
          }),
        );
      });

      if (_.isEmpty(imageLibraries) && shouldIncludePlaceholderLibrary) {
        // If the business doesn't have any image libraries, create a placeholder
        // which we can use if the user tries to save an image for the first time
        imageLibraries.push(
          new BusinessImageLibrary({
            displayName: businessImageLibraryName,
            slug: null,
            images: [],
            removedImages: [],
            businessGUID,
            logoImageGUID: null,
          }),
        );
      }
    }

    return imageLibraries;
  }, [businessData, businessGUID, shouldIncludePlaceholderLibrary]);

  return {
    isLoading,
    businessImageLibraries,
  };
};
