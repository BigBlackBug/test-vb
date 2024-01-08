// Vendor
import { gql } from '@apollo/client';

import { BFSFontVariant } from 'libs/shared-types';
import { GraphQLNode } from 'shared/types';

// BFSFontVariants don't correspond to any actual database records, so
// this fragment doesn't have an id
export const bfsFontVariantFieldsFragment = gql`
  fragment BFSFontVariantFields on BFSFontVariant {
    uuid
    isItalic
    weightIndex
  }
`;

// Template font record where we store info about the font from the BFS
export const templateFontFields = gql`
  ${bfsFontVariantFieldsFragment}

  fragment TemplateFontFields on TemplateFontNode {
    id
    bfsUuid
    fontFamilyName
    variants {
      ...BFSFontVariantFields
    }
  }
`;
export interface TemplateFontNode extends GraphQLNode {
  bfsUuid: string;
  fontFamilyName: string;
  variants: Array<BFSFontVariant>;
}

// Font library fonts
export const fontLibraryFontFieldsFragment = gql`
  ${templateFontFields}

  fragment FontLibraryFontFields on FontLibraryFontNode {
    id
    guid
    displayName
    order
    updatedAt
    font {
      ...TemplateFontFields
    }
  }
`;
export interface FontLibraryFontNode extends GraphQLNode {
  guid: string;
  displayName: string;
  order: number;
  updatedAt: Date;
  font: TemplateFontNode;
}

// Font library
export const fontLibraryFields = gql`
  ${fontLibraryFontFieldsFragment}

  fragment FontLibraryFields on FontLibraryNode {
    id
    guid
    displayName
    fonts {
      edges {
        node {
          ...FontLibraryFontFields
        }
      }
    }
  }
`;
export interface FontLibraryNode extends GraphQLNode {
  guid: string;
  displayName: string;
  fonts: {
    edges: Array<{
      node: FontLibraryFontNode;
    }>;
  };
}

// Query for all font libraries belonging to a business
type FontLibraryNodeConnection = {
  edges: Array<{
    node: FontLibraryNode;
  }>;
};

export const fontLibrariesForBusinessQuery = gql`
  ${fontLibraryFields}

  query FontLibrariesForBusiness($businessGUID: String) {
    businessByGuid(guid: $businessGUID) {
      id
      businessName
      guid
      fontLibraries {
        edges {
          node {
            ...FontLibraryFields
          }
        }
      }
    }
  }
`;
export interface FontLibrariesForBusinessResult {
  businessByGuid: GraphQLNode & {
    businessName: string;
    guid: string;
    fontLibraries: FontLibraryNodeConnection;
  };
}

// Query for all font libraries belonging to an account and/or their account groups
export const fontLibrariesForAccountQuery = gql`
  ${fontLibraryFields}

  query FontLibrariesForAccount($accountGUID: String) {
    accountByGuid(guid: $accountGUID) {
      id
      displayName
      guid
      fontLibraries {
        edges {
          node {
            ...FontLibraryFields
          }
        }
      }
      accountGroups {
        edges {
          node {
            id
            displayName
            fontLibraries {
              edges {
                node {
                  ...FontLibraryFields
                }
              }
            }
          }
        }
      }
    }
  }
`;
export interface FontLibrariesForAccountResult {
  accountByGuid: GraphQLNode & {
    displayName: string;
    guid: string;
    fontLibraries: FontLibraryNodeConnection;
    accountGroups: {
      edges: Array<{
        node: GraphQLNode & {
          displayName: string;
          fontLibraries: FontLibraryNodeConnection;
        };
      }>;
    };
  };
}

// Global font libraries available to all users
export const globalFontLibrariesQuery = gql`
  ${fontLibraryFields}

  query GlobalFontLibraries {
    globalFontLibraries {
      edges {
        node {
          ...FontLibraryFields
        }
      }
    }
  }
`;
export interface GlobalFontLibrariesResult {
  globalFontLibraries: FontLibraryNodeConnection;
}
