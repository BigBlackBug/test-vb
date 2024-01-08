import { UnformattedAccountPageUserVideo } from 'shared/api/graphql/userVideos/queries';

import { VoiceOverStatus } from '../types';
import AccountPageUserVideo from '../AccountPageUserVideo';

import { getFormattedUserVideoApprovalRequest } from './userVideoApprovalRequest';

/**
 * Converts an unformatted account page user video from the GraphQL API into
 * a formatted AccountPageUserVideo instance.
 *
 * @param {UnformattedAccountPageUserVideo} unformattedAccountPageUserVideo - Unformatted account page user video object
 */
const formatAccountPageUserVideo = (
  unformattedAccountPageUserVideo: UnformattedAccountPageUserVideo,
): AccountPageUserVideo => {
  const {
    guid,
    title,
    updatedAt,
    purchasedAt,
    lastEditedByUser,
    lastEditableDate,
    currentConfiguredVideo,
    videoTemplateVariant,
    business,
    voiceOverProduct,
    userVideoApprovals,
    purchaseApproval,
  } = unformattedAccountPageUserVideo;

  let voiceOverStatus: VoiceOverStatus | null = null;

  if (voiceOverProduct) {
    voiceOverStatus = voiceOverProduct.isDelivered
      ? VoiceOverStatus.delivered
      : VoiceOverStatus.inProgress;
  }

  const videoApproval = getFormattedUserVideoApprovalRequest(userVideoApprovals);

  // Some videos don't have a lastEditedByUser date set (ie, a video created by duplicating a draft
  // which hasn't been opened in the editor yet), so in those cases we'll fall back to the updatedAt date
  const lastEditedDateString = lastEditedByUser || updatedAt;

  return new AccountPageUserVideo({
    guid: guid as string,
    title,
    purchasedAt: purchasedAt ? new Date(purchasedAt) : null,
    lastEditedDate: lastEditedDateString ? new Date(lastEditedDateString) : null,
    lastEditableDate: lastEditableDate ? new Date(lastEditableDate) : null,
    variantName: videoTemplateVariant.displayName,
    duration: videoTemplateVariant.displayDuration as number,
    width: videoTemplateVariant.width,
    height: videoTemplateVariant.height,
    isWaymarkAuthorTemplate: videoTemplateVariant.videoTemplate.isWaymarkAuthorTemplate,
    businessName: business?.businessName ?? null,
    thumbnailURL: currentConfiguredVideo?.thumbnailUrl ?? null,
    voiceOverStatus,
    videoApproval,
    purchaseApproval: purchaseApproval
      ? {
          createdAt: new Date(purchaseApproval.createdAt),
          approvedAt: purchaseApproval.approvedAt ? new Date(purchaseApproval.approvedAt) : null,
          isApproved: purchaseApproval.approvedAt !== null,
        }
      : null,
  });
};

/**
 * Takes account page user video query data from the GraphQL API and converts it into
 * an array of formatted AccountPageUserVideo instances.
 *
 * @param {Object} unformattedAccountPageUserVideos - Unformatted account page user video query data
 */
export const getAccountPageUserVideosFromQueryData = (
  unformattedAccountPageUserVideos:
    | {
        edges: Array<{
          node: UnformattedAccountPageUserVideo;
        }>;
      }
    | undefined,
) =>
  unformattedAccountPageUserVideos?.edges.map(({ node }) => formatAccountPageUserVideo(node)) ?? [];
