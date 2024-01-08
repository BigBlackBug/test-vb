// Local
import baseAPI from 'shared/api/core/base.js';

/**
 * Validate template CSV by parsing it and the associated bundle.
 *
 * @param {string} csv: Template CSV data.
 * @param {dict} placeholderConfiguration: UserVideo variant configuration.
 * @param {string} templateSlug: Template slug.
 */
export const validateTemplateCSV = (csv, templateSlug, placeholderConfiguration) => {
    const url = `admin/templates/validate/`;
    return baseAPI.post(url, {
        csv,
        placeholder_configuration: placeholderConfiguration,
        template_slug: templateSlug,
    });
};

/**
 * Create a template from a deployment configuration.
 *
 *  NOTE: Template and variant creation are a little muddled together right now because
 *        the variant creation CSV is set up for both. I think we'll want to make more
 *        of a separation between the two in the next iteration of the UI.
 *
 * @param {string} creationData: Template configuration data.
 * @param {int} offerId: VideoTemplateVariantOffer id.
 * @param {string} variantAudioSlug: VideoTemplateVariant slug.
 */
export const createTemplate = (creationData, offerId, variantAudioSlug) => {
    const url = `admin/templates/`;
    return baseAPI.post(url, {
        creation_data: creationData,
        offer_id: offerId,
        variant_audio_slug: variantAudioSlug,
    });
};

/**
 * Create and upload a thumbnail image for a given VideoTemplateVariant.
 *
 * @param {int} videoTemplateVariantId: VideoTemplateVariant id
 * @param {file} thumbnailImageFile: Image file to be used as VideoTemplateVariant thumbnail image.
 */
export const addVariantThumbnail = (videoTemplateVariantId, thumbnailImageFile) => {
    const url = `admin/templates/thumbnail-image/`;
    const postData = new FormData();

    // Add the file itself.
    postData.append('thumbnail_image_file', thumbnailImageFile);
    postData.append('video_template_variant_id', videoTemplateVariantId);

    return baseAPI.post(url, postData);
};