// Vendor
import _ from 'lodash';
import { useMemo } from 'react';
import { useQuery } from '@apollo/client';

// Local
import AccountColorLibrary from './AccountColorLibrary';
import BusinessColorLibrary from './BusinessColorLibrary';
import StaticColorLibrary from './StaticColorLibrary';
import {
  accountColorLibrariesQuery,
  AccountColorLibrariesQueryResult,
  businessColorLibrariesQuery,
  BusinessColorLibrariesQueryResult,
} from './queries';
import { getColorLibraryDataFromNode } from './utils';

/**
 * Hooks fetches query data for ColorLibraries owned by the given account and their account group
 *
 * @param {string}  accountGUID   The GUID for the Account we're getting libraries for
 * @param {bool}  [shouldIncludePlaceholderLibrary=true]  Whether to include a placeholder library if the user is
 *                                                          logged out or their account doesn't have an existing library
 */
export const useColorLibrariesForAccount = (
  accountGUID: string | null,
  shouldIncludePlaceholderLibrary = true,
) => {
  const { data: accountColorLibraryQueryData, loading: isLoading } =
    useQuery<AccountColorLibrariesQueryResult>(accountColorLibrariesQuery, {
      variables: {
        accountGUID,
      },
      skip: !accountGUID,
      // The first time that this hook is run, make sure we call out to the server to ensure
      // our library data is in sync with what's in the DB
      fetchPolicy: 'network-only',
      // On subsequent re-runs of this hook, prefer to use data in the apollo cache
      nextFetchPolicy: 'cache-first',
    });

  const accountData = accountColorLibraryQueryData?.accountByGuid;

  // Create an AccountColorLibrary model instance for each of the account's AccountColorLibraries;
  // if the account doesn't have any libraries, we'll create a placeholder
  const accountColorLibraries = useMemo(() => {
    const accountLibraries: Array<AccountColorLibrary> = [];

    const defaultLibraryDisplayName = 'My Colors';

    if (accountData) {
      // Create ColorLibrary instances for all of the account's AccountColorLibraries
      accountData.colorLibraries.edges.forEach(({ node }) => {
        const formattedColorLibraryData = getColorLibraryDataFromNode(node);

        accountLibraries.push(
          new AccountColorLibrary({
            ...formattedColorLibraryData,
            displayName: formattedColorLibraryData.displayName || defaultLibraryDisplayName,
            accountGUID: accountData.guid,
          }),
        );
      });

      if (shouldIncludePlaceholderLibrary && _.isEmpty(accountLibraries)) {
        // If there isn't an account or the account doesn't have any color libraries, create a placeholder
        // which we can use if the user tries to save a color for the first time
        // Note that we're including the state where the user is not logged in, because we want to
        // be able to show a placeholder "add" button in the UI which will force the user to
        // log in before they can actually proceed to save a color

        accountLibraries.push(
          new AccountColorLibrary({
            displayName: defaultLibraryDisplayName,
            guid: null,
            colors: [],
            accountGUID: accountData.guid,
          }),
        );
      }
    }

    return accountLibraries;
  }, [accountData, shouldIncludePlaceholderLibrary]);

  const accountGroupData = accountData?.accountGroups;

  // Create a StaticColorLibrary model instance for each of the account group's libraries
  const accountGroupColorLibraries = useMemo(() => {
    const colorLibraries: Array<StaticColorLibrary> = [];

    if (accountGroupData) {
      // Create StaticColorLibrary instances for all of the account's AccountGroupColorLibraries
      accountGroupData.edges.forEach(({ node: accountGroupNode }) => {
        accountGroupNode.colorLibraries?.edges.forEach(({ node: colorLibraryNode }) => {
          const formattedColorLibraryData = getColorLibraryDataFromNode(colorLibraryNode);

          const accountGroupColorLibrary = new StaticColorLibrary({
            ...formattedColorLibraryData,
            displayName: formattedColorLibraryData.displayName || accountGroupNode.displayName,
          });
          colorLibraries.push(accountGroupColorLibrary);
        });
      });
    }

    return colorLibraries;
  }, [accountGroupData]);

  return {
    accountColorLibraries,
    accountGroupColorLibraries,
    isLoading,
  };
};

/**
 * Hook fetches query data for ColorLibraries owned by the given business
 *
 * @param {string}  businessGUID    The GUID for the Business we're getting libraries for
 * @param {bool}  [shouldIncludePlaceholderLibrary=true]  Whether to include a placeholder library if the business doesn't have an existing library
 */
export const useColorLibrariesForBusiness = (
  businessGUID: string | null,
  shouldIncludePlaceholderLibrary = true,
) => {
  const { data: businessColorLibraryQueryData, loading: isLoading } =
    useQuery<BusinessColorLibrariesQueryResult>(businessColorLibrariesQuery, {
      variables: {
        businessGUID,
      },
      skip: !businessGUID,
    });

  const businessData = businessColorLibraryQueryData?.businessByGuid;

  // Creates BusinessColorLibrary model instances for the business' libraries
  const businessColorLibraries = useMemo(() => {
    const colorLibraries: Array<BusinessColorLibrary> = [];

    if (businessData) {
      const defaultLibraryDisplayName = `${businessData.businessName || 'Brand'} Colors`;

      // Create ColorLibrary instances for all of the business' BusinessColorLibraries
      businessData.colorLibraries?.edges.forEach(({ node }) => {
        const formattedColorLibraryData = getColorLibraryDataFromNode(node);

        colorLibraries.push(
          new BusinessColorLibrary({
            ...formattedColorLibraryData,
            displayName: formattedColorLibraryData.displayName || defaultLibraryDisplayName,
            businessGUID: businessData.guid,
          }),
        );
      });

      if (shouldIncludePlaceholderLibrary && _.isEmpty(colorLibraries)) {
        // If the business doesn't have any color libraries, create a placeholder
        // which we can use if the user tries to save a color for the first time
        colorLibraries.push(
          new BusinessColorLibrary({
            displayName: defaultLibraryDisplayName,
            guid: null,
            colors: [],
            businessGUID: businessData.guid,
          }),
        );
      }
    }

    return colorLibraries;
  }, [businessData, shouldIncludePlaceholderLibrary]);

  return { businessColorLibraries, isLoading };
};
