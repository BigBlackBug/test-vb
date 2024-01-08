import { EditorUserVideo } from 'editor/types/userVideo';
import { EditorVariant } from 'editor/types/videoTemplateVariant';

import {
  UnformattedUserVideoWithVideoDescriptor,
  UnformattedVideoTemplateVariant,
} from 'shared/api/types';
import { getSanitizedVideoDescriptor } from 'shared/web_video/utils/videoDescriptor';

/**
 * Formats a raw serialized UserVideo record into an object that can be used in the editor
 */
export function formatUserVideoForEditor(
  userVideo: UnformattedUserVideoWithVideoDescriptor | null,
  businessIsArchived = false,
): EditorUserVideo | null {
  if (!userVideo) {
    return null;
  }

  return {
    guid: userVideo.guid,
    videoTitle: userVideo.title,
    videoDescriptor: userVideo.videoDescriptor,
    variantSlug: userVideo.video_template_variant,
    variantGUID: userVideo.video_template_variant_guid,
    isPurchased: Boolean(userVideo.purchased_product_object_id),
    createdAt: userVideo.created_at,
    updatedAt: userVideo.updated_at,
    lastEditedByUser: userVideo.last_edited_by_user,
    personalizedBusinessGUID: businessIsArchived ? null : userVideo.business,
    automatedVoiceOver: {
      speakerGUID: userVideo.voice_over_speaker_guid || null,
      text: userVideo.voice_over_text || '',
    },
  };
}

/**
 * Formats a raw serialized VideoTemplateVariant record into an object that can be used in the editor
 */
export async function formatVariantForEditor(
  variant: UnformattedVideoTemplateVariant | null,
): Promise<EditorVariant | null> {
  if (!variant) {
    return null;
  }

  const videoDescriptor = await getSanitizedVideoDescriptor({
    variantSlug: variant.slug,
    configuration: variant.default_configuration,
  });

  return {
    displayName: variant.display_name,
    slug: variant.slug,
    videoTemplateSlug: variant.video_template,
    guid: variant.guid,
    videoDescriptor,
    width: variant.width,
    height: variant.height,
    aspectRatio: variant.width / variant.height,
    shouldIncludeGlobalAudio: variant.should_include_global_audio,
    offerSlug: variant.offer,
    displayDuration: variant.display_duration,
    personalizedBusinessGUID: variant.selected_business,
  };
}
