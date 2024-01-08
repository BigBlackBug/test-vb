// Vendor
import _ from 'lodash';

// Local
import { ImageFieldConfigurationValueContent } from 'editor/types/configuration';
import settings from './settings.js';
import { addQueryParametersToURL } from './urls.js';

const APP_ENVIRONMENT =
  !settings.APP_ENVIRONMENT || settings.APP_ENVIRONMENT === 'local'
    ? 'dev'
    : settings.APP_ENVIRONMENT;

const WAYMARK_S3_LOCATION_SOURCES = {
  socialproofImagesWeb: `sp-${APP_ENVIRONMENT}-s3-images-web`,
  socialproofCustomerAssets: `sp-${APP_ENVIRONMENT}-s3-customer-assets`,
  socialproofS3Assets: 'sp-prod-s3-assets',
};

/**
 * Constructs an S3 URL for a given image asset.
 *
 * @param {object}        - Waymark image asset.
 */
export const convertImageAssetToS3URL = (imageAsset: ImageFieldConfigurationValueContent) => {
  const locationSource =
    WAYMARK_S3_LOCATION_SOURCES[
      imageAsset.location.type as keyof typeof WAYMARK_S3_LOCATION_SOURCES
    ];
  if (!locationSource) {
    return null;
  }

  const protocol = APP_ENVIRONMENT === 'local' ? 'http' : 'https';
  return `${protocol}://${locationSource}.s3.amazonaws.com/${imageAsset.location.key}`;
};

/**
 * An object to handle an image element's src and srcset attributes
 *
 * @class      SrcSet (name)
 * @param {string} defaultSrc    - The default src attribute of an image
 * @param {object} [spaces={}]   - An object to populate the srcset attribute in the form of pairs of keys (spaces) and values (urls)
 */
export class SrcSet {
  constructor(public defaultSrc: string, public spaces: Record<string, string> = {}) {}

  /**
   * Given an imgix url, create a SrcSet object with two spaces for 2x & 3x sizes
   *
   * @param      {String}  imgixUrl              -  The imgix url
   * @param      {Object}  [imgixParameters={}]  -  Additional imgix parameters
   * @return     {SrcSet}
   */
  static populateFromImgixUrl(
    imgixUrl: string,
    imgixParameters: { [key: string]: string | number } = {},
  ) {
    return new SrcSet(addQueryParametersToURL(imgixUrl, { ...imgixParameters, dpr: 1 }), {
      '2x': addQueryParametersToURL(imgixUrl, { ...imgixParameters, dpr: 2 }),
      '3x': addQueryParametersToURL(imgixUrl, { ...imgixParameters, dpr: 3 }),
    });
  }

  /**
   * Prepares the source set attribute from the internal spaces instance varoable
   *
   * @return     {String}  The source set attribute.
   */
  getSrcSetAttribute() {
    return _.reduce(
      this.spaces,
      (result, value, key) => {
        /* eslint-disable-next-line no-param-reassign */
        result += `${value} ${key}, `;
        return result;
      },
      '',
    );
  }
}

/**
 * A utility function for parsing out a mixed proptype where you might have a string or a srcset object
 * and returning an object of the src and srcset attributes for an image element
 *
 * @param      {String|SrcSet}  source                - The source object to parse
 * @return     {Object}         attributes            - An object of the src and srcset attributes to populate an image element
 * @return     {String}         attributes.src        - The src attribute
 * @return     {String|null}    [attributes.srceset]  - The srcset attribute
 */
export const parseMixedImageSourceTypes = (source: string | SrcSet) => {
  // By default, if the source is a String, we'll want that to be the src attribute
  let src: string;
  let srcSet: string | null = null;

  if (source instanceof SrcSet) {
    src = source.defaultSrc;

    // Parse out the spaces object and concat them into a string
    srcSet = source.getSrcSetAttribute();
  } else {
    src = source;
  }

  return {
    src,
    srcSet,
  };
};

/**
 * Get the image dimensions for the image that is being uploaded. We are not doing this on the
 * server because it no longer has access to the actual image file itself, so we'll have to
 * pass these values to the API.
 *
 * @param {string} imageDataURL  The base 64 data URL containing the image data.
 */
export const getImageDimensionsFromDataURL = (imageDataURL: string) =>
  new Promise<{
    width: number;
    height: number;
  }>((resolve, reject) => {
    const image = new Image();

    image.onload = () => {
      const dimensions = {
        width: image.width,
        height: image.height,
      };

      image.remove();

      resolve(dimensions);
    };

    image.onerror = (error) => reject(error);

    image.src = imageDataURL;
  });
