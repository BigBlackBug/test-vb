import { gql } from '@apollo/client';
import PropTypes from 'prop-types';

import {
  BusinessRelayNode,
  ColorLibraryNodeConnection,
  ColorLibraryNodeEdge,
} from '@libs/graphql-types';

import { ImageLibraryImage, imageLibraryFragments } from '../imageLibraries/fragments';
import { ColorLibraryFragment, ColorLibrary } from '../colorLibraries/fragments';

const coreBusinessDetailsFragmentName = 'CoreBusinessDetailsFragment' as const;

// Core fields needed to display basic info about a business (excludes media libraries as these are heavier; we'll only query for those when needed)
const coreBusinessDetailsFragment = gql`
  ${imageLibraryFragments.imageLibraryImage.fragment}
  ${ColorLibraryFragment}

  fragment ${coreBusinessDetailsFragmentName} on BusinessRelayNode {
    id
    pk
    createdAt
    guid
    isVisible
    businessName
    businessAbout
    websiteUrl
    streetAddress1
    streetAddress2
    city
    state
    postalCode
    contactPhone
    industryName
    totalImageCount
    totalVideoCount
    logoImage {
      ...${imageLibraryFragments.imageLibraryImage.name}
    }
    colorLibraries {
      edges {
        node {
          ...ColorLibraryFragment
        }
      }
    }
  }
`;

export const businessFragments = {
  coreBusinessDetails: {
    name: coreBusinessDetailsFragmentName,
    fragment: coreBusinessDetailsFragment,
  },
} as const;

export const businessRelayNodeTypeName: BusinessRelayNode['__typename'] =
  'BusinessRelayNode' as const;

export type CoreBusinessDetails = Pick<
  BusinessRelayNode,
  | '__typename'
  | 'pk'
  | 'id'
  | 'createdAt'
  | 'guid'
  | 'isVisible'
  | 'businessName'
  | 'businessAbout'
  | 'websiteUrl'
  | 'streetAddress1'
  | 'streetAddress2'
  | 'city'
  | 'state'
  | 'postalCode'
  | 'contactPhone'
  | 'industryName'
  | 'totalImageCount'
  | 'totalVideoCount'
> & {
  logoImage: ImageLibraryImage;
  colorLibraries: Pick<ColorLibraryNodeConnection, '__typename'> & {
    edges: Array<
      Pick<ColorLibraryNodeEdge, '__typename'> & {
        node: ColorLibrary;
      }
    >;
  };
};

/**
 * PropType definitions for Business data returned from GraphQL
 */
export const coreBusinessDetailsPropType = PropTypes.shape({
  id: PropTypes.string,
  createdAt: PropTypes.string,
  guid: PropTypes.string,
  isVisible: PropTypes.bool,
  businessName: PropTypes.string,
  businessAbout: PropTypes.string,
  websiteUrl: PropTypes.string,
  streetAddress1: PropTypes.string,
  streetAddress2: PropTypes.string,
  city: PropTypes.string,
  state: PropTypes.string,
  postalCode: PropTypes.string,
  contactPhone: PropTypes.string,
  industryName: PropTypes.string,
  logoImage: PropTypes.shape({
    id: PropTypes.string,
    guid: PropTypes.string,
    baseUrl: PropTypes.string,
  }),
  colorLibraries: PropTypes.shape({
    edges: PropTypes.arrayOf(PropTypes.object),
  }),
});
