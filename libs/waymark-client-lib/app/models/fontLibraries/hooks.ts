// Vendor
import _ from 'lodash';
import { useMemo } from 'react';
import { useQuery } from '@apollo/client';

// Local
import {
  fontLibrariesForBusinessQuery,
  FontLibrariesForBusinessResult,
  fontLibrariesForAccountQuery,
  FontLibrariesForAccountResult,
  globalFontLibrariesQuery,
  GlobalFontLibrariesResult,
} from './queries';
import { getFontLibraryDataFromNode } from './utils';
import AccountFontLibrary from './AccountFontLibrary';
import BusinessFontLibrary from './BusinessFontLibrary';
import StaticFontLibrary from './StaticFontLibrary';

/**
 * Hook fetches query data for FontLibraries owned by the given account and their account group
 *
 * @param {string} businessGUID   The GUID for the Business we're getting libraries for
 * @param {bool}  [shouldIncludePlaceholderLibrary=true]  Whether to include a placeholder library if the account doesn't have an existing font library
 */
export const useFontLibrariesForAccount = (
  accountGUID: string | null,
  shouldIncludePlaceholderLibrary = true,
) => {
  const { data: accountFontLibraryQueryData, loading: isLoading } =
    useQuery<FontLibrariesForAccountResult>(fontLibrariesForAccountQuery, {
      variables: { accountGUID },
      skip: !accountGUID,
      // The first time that this hook is run, make sure we call out to the server to ensure
      // our library data is in sync with what's in the DB
      fetchPolicy: 'network-only',
      // On subsequent re-runs of this hook, prefer to use data in the apollo cache
      nextFetchPolicy: 'cache-first',
    });

  const accountData = accountFontLibraryQueryData?.accountByGuid;

  // Creates AccountFontLibrary model instances for the account's libraries
  const accountFontLibraries = useMemo(() => {
    const libraries: Array<AccountFontLibrary> = [];

    if (accountData) {
      const defaultAccountFontLibraryName = 'My Fonts';

      accountData.fontLibraries.edges.forEach(({ node: fontLibraryNode }) => {
        const formattedFontLibraryData = getFontLibraryDataFromNode(fontLibraryNode);

        libraries.push(
          new AccountFontLibrary({
            ...formattedFontLibraryData,
            displayName: formattedFontLibraryData.displayName || defaultAccountFontLibraryName,
            accountGUID: accountData.guid,
          }),
        );
      });

      if (_.isEmpty(libraries) && shouldIncludePlaceholderLibrary) {
        // If the account doesn't have any font libraries, create a placeholder
        // which we can use if the user tries to save a font for the first time
        libraries.push(
          new AccountFontLibrary({
            displayName: defaultAccountFontLibraryName,
            guid: null,
            fonts: [],
            accountGUID: accountData.guid,
          }),
        );
      }
    }

    return libraries;
  }, [accountData, shouldIncludePlaceholderLibrary]);

  const accountGroupData = accountData?.accountGroups;

  // Creates StaticFontLibrary model instances for the account's account group's font libraries
  const accountGroupFontLibraries = useMemo(() => {
    const fontLibraries: Array<StaticFontLibrary> = [];

    if (accountGroupData) {
      // Create FontLibrary instances for all of the account's account group's AccountGroupFontLibraries
      accountGroupData.edges.forEach(({ node: accountGroupNode }) => {
        accountGroupNode.fontLibraries?.edges.forEach(({ node: fontLibraryNode }) => {
          const formattedFontLibraryData = getFontLibraryDataFromNode(fontLibraryNode);

          fontLibraries.push(
            // Account group libraries aren't editable so we'll use a StaticFontLibrary
            new StaticFontLibrary({
              ...formattedFontLibraryData,
              displayName:
                formattedFontLibraryData.displayName || `${accountGroupNode.displayName} fonts`,
            }),
          );
        });
      });
    }

    return fontLibraries;
  }, [accountGroupData]);

  return {
    accountFontLibraries,
    accountGroupFontLibraries,
    isLoading,
  };
};

/**
 * Hook fetches query data for FontLibraries owned by the given business
 *
 * @param {string} businessGUID   The GUID for the Business we're getting libraries for
 * @param {bool}  [shouldIncludePlaceholderLibrary=true]  Whether to include a placeholder library if the business doesn't have an existing font library
 */
export const useFontLibrariesForBusiness = (
  businessGUID: string | null,
  shouldIncludePlaceholderLibrary = true,
) => {
  const { data: businessFontLibraryQueryData, loading: isLoading } =
    useQuery<FontLibrariesForBusinessResult>(fontLibrariesForBusinessQuery, {
      variables: { businessGUID },
      skip: !businessGUID,
      // The first time that this hook is run, make sure we call out to the server to ensure
      // our library data is in sync with what's in the DB
      fetchPolicy: 'network-only',
      // On subsequent re-runs of this hook, prefer to use data in the apollo cache
      nextFetchPolicy: 'cache-first',
    });

  const businessData = businessFontLibraryQueryData?.businessByGuid;

  // Creates BusinessFontLibrary model instances for the business' libraries
  const businessFontLibraries = useMemo(() => {
    const libraries: Array<BusinessFontLibrary> = [];

    if (businessData) {
      const { businessName } = businessData;

      const defaultBusinessFontLibraryName = `${businessName || 'Brand'} Fonts`;

      // Create FontLibrary instances for all of the business' BusinessFontLibraries
      businessData.fontLibraries?.edges.forEach(({ node: fontLibraryNode }) => {
        const formattedFontLibraryData = getFontLibraryDataFromNode(fontLibraryNode);
        libraries.push(
          new BusinessFontLibrary({
            ...formattedFontLibraryData,
            displayName: formattedFontLibraryData.displayName || defaultBusinessFontLibraryName,
            businessGUID: businessData.guid,
          }),
        );
      });

      if (_.isEmpty(libraries) && shouldIncludePlaceholderLibrary) {
        // If the business doesn't have any font libraries, create a placeholder
        // which we can use if the user tries to save a font for the first time
        libraries.push(
          new BusinessFontLibrary({
            displayName: defaultBusinessFontLibraryName,
            guid: null,
            fonts: [],
            businessGUID: businessData.guid,
          }),
        );
      }
    }

    return libraries;
  }, [businessData, shouldIncludePlaceholderLibrary]);

  return { businessFontLibraries, isLoading };
};

/**
 * Hook fetches query data for GlobalFontLibraries which should be available to all users
 */
export function useGlobalFontLibraries(shouldSkip: boolean) {
  const { data: globalFontLibraryQueryData, loading: isLoading } =
    useQuery<GlobalFontLibrariesResult>(globalFontLibrariesQuery, {
      variables: {},
      skip: shouldSkip,
    });

  const globalFontLibraries = useMemo(() => {
    const fontLibraries: Array<StaticFontLibrary> = [];

    globalFontLibraryQueryData?.globalFontLibraries.edges.forEach(({ node: fontLibraryNode }) => {
      const formattedFontLibraryData = getFontLibraryDataFromNode(fontLibraryNode);
      fontLibraries.push(new StaticFontLibrary(formattedFontLibraryData));
    });

    return fontLibraries;
  }, [globalFontLibraryQueryData]);

  return { globalFontLibraries, isLoading };
}
