// Vendor
import axios from 'axios';

// Local
import baseAPI from 'shared/api/core/base.js';
import { readFileAsDataURL } from 'shared/utils/files.js';
import { getImageDimensionsFromDataURL } from 'shared/utils/images';

const IMAGE_LIBRARY_IMAGE_SIGNING_URL = 'image-library-images-upload-signing/';

/**
 * Service provides basic image uploading to S3.
 */
class ImageUploadService {
  /**
   * Upload an image to S3 using a signed URL.
   *
   * To upload to S3 we'll need permission via a signed URL construct. This allows us to
   * temporarily use the server's permissions to create a file in S3 in a specific place.
   *
   * @param {string}   signingURL   The server URL where the signing service for this
   *                                particular image is located.
   * @param {file}     imageFile    The file object to upload to S3.
   * @param {string}   contentType  The mime type of the image (eg. image/jpeg,
   *                                image/png, etc.)
   * @param {function} onProgress   The function to call to update the upload progress.
   */
  static async uploadImageToS3(
    signingURL: string,
    imageFile: File,
    contentType: string,
    onProgress?: (progressEvent: ProgressEvent) => void,
  ): Promise<string> {
    const payload = {
      content_type: contentType,
    };

    const signingData: {
      url: string;
      fields: {
        [key: string]: string;
      };
    } = await baseAPI.post(signingURL, payload);

    /**
     * The signed URL will look something like this:
     *  {
     *    'fields': {
     *      'Content-Type': 'image/jpeg',
     *      'acl': 'public-read',
     *      'key': 'businesses/businessimage/image/1111.jpg',
     *      'policy': 'eyJ....fQ==',
     *      'x-amz-algorithm': 'AWS4-HMAC-SHA256',
     *      'x-amz-credential': 'AKIA..../20200218/us-east-1/s3/aws4_request',
     *      'x-amz-date': '20200218T185635Z',
     *      'x-amz-signature': 'c29a.......387d'
     *    },
     *   'url': 'https://sp-dev-s3-customer-assets.s3.amazonaws.com/'
     *  }
     */

    const postData = new FormData();
    // All of the fields should be copied into the form for POSTing to S3.
    Object.entries(signingData.fields).forEach(([key, value]) => {
      postData.append(key, value);
    });

    // Add the file itself.
    postData.append('file', imageFile);

    await axios.post(signingData.url, postData, {
      onUploadProgress: onProgress,
    });

    // This is the file name of the uploaded file. We need to use this to create
    // the actual image instance via another API call.
    return signingData.fields.key;
  }

  /**
   * Uploads an ImageLibraryImage directly to S3.
   *
   * @param {File} imageFile    Image file object
   */
  uploadImageLibraryImage = async (
    imageFile: File,
    onProgress?: (progressEvent: ProgressEvent) => void,
  ) => {
    const imageDataURL = await readFileAsDataURL(imageFile);

    // Get the content type from the "data:image/XXXX;...." portion of
    // the image URL string.
    const contentType = imageDataURL.substring(5, imageDataURL.indexOf(';'));
    const { width, height } = await getImageDimensionsFromDataURL(imageDataURL);

    const imageFileName = await ImageUploadService.uploadImageToS3(
      IMAGE_LIBRARY_IMAGE_SIGNING_URL,
      imageFile,
      contentType,
      onProgress,
    );

    return {
      imageFileName,
      width,
      height,
    };
  };
}

export default new ImageUploadService();
