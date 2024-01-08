// Vendor
import { gql } from '@apollo/client';

// Shared
import { apolloClient } from 'shared/api/graphql';
import { getOrCreateDefaultBusinessImageLibrary } from 'shared/api/graphql/imageLibraries/mutations';

// App
import BaseEditableImageLibrary from './BaseEditableImageLibrary';
import ImageAsset from './ImageAsset';
import { FormattedImageLibraryData } from './types';
import { getImageLibraryDataFromNode } from './utils';

// Query re-fetches the business' total image count and logo image when images are added/removed from a business image library
const REFETCH_BUSINESS_IMAGE_DATA_QUERY = gql`
  query BusinessImageData($businessGUID: String!) {
    businessByGuid(guid: $businessGUID) {
      id
      guid
      totalImageCount
      logoImage {
        id
        guid
        baseUrl
        updatedAt
      }
    }
  }
`;

export default class BusinessImageLibrary extends BaseEditableImageLibrary {
  businessGUID: string | null;
  logoImageGUID: string | null;

  isBusinessLibrary = true;

  constructor({
    businessGUID,
    logoImageGUID,
    ...imageLibraryData
  }: {
    businessGUID: string | null;
    logoImageGUID: string | null;
  } & FormattedImageLibraryData) {
    super(imageLibraryData);

    this.businessGUID = businessGUID;
    this.logoImageGUID = logoImageGUID;
  }

  /**
   * If this BusinessFontLibrary instance is a placeholder, this method will get/create
   * a default font library for the business and update this instance to track that new library.
   */
  async createImageLibrary() {
    if (!this.businessGUID) {
      return null;
    }

    // Get or create default FontLibrary + BusinessFontLibrary records for the business
    const result = await getOrCreateDefaultBusinessImageLibrary(this.businessGUID);

    if (!result) {
      return null;
    }

    this.slug = result.imageLibrary.slug;
    this.displayName = result.imageLibrary.displayName;

    return getImageLibraryDataFromNode(result.imageLibrary);
  }

  /**
   * Refetches the business' totalImageCount and logoImage when an image is added to/removed from this library
   */
  async refetchBusinessImageData() {
    await apolloClient.query({
      query: REFETCH_BUSINESS_IMAGE_DATA_QUERY,
      variables: {
        businessGUID: this.businessGUID,
      },
      fetchPolicy: 'network-only',
    });
  }

  async uploadImageFile(imageFile: File) {
    const result = await super.uploadImageFile(imageFile);

    await this.refetchBusinessImageData();

    return result;
  }

  async removeImage(imageToRemove: ImageAsset) {
    const result = await super.removeImage(imageToRemove);

    await this.refetchBusinessImageData();

    return result;
  }

  async restoreRemovedImage(imageToRestore: ImageAsset) {
    const result = await super.restoreRemovedImage(imageToRestore);

    await this.refetchBusinessImageData();

    return result;
  }
}
