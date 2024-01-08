import _ from 'lodash';

import { UnformattedAccountPageUserVideo } from 'shared/api/graphql/userVideos/queries';
import { VideoApprovalRequest } from '../types';

/**
 * Converts an array of unformatted UserVideoApprovalNodes into a formatted VideoApprovalRequest
 * object which represents the current approval status of a video.
 *
 * @param {UserVideoApprovalNode[]} userVideoApprovals
 */
export const getFormattedUserVideoApprovalRequest = (
  userVideoApprovals: UnformattedAccountPageUserVideo['userVideoApprovals'],
): VideoApprovalRequest | null => {
  if (_.isEmpty(userVideoApprovals)) {
    return null;
  }

  const currentUserVideoApproval = userVideoApprovals[0];
  const isApproved = currentUserVideoApproval.approvedAt !== null;

  return {
    createdAt: new Date(currentUserVideoApproval.createdAt),
    fullName: currentUserVideoApproval.fullName,
    approvedAt: currentUserVideoApproval.approvedAt
      ? new Date(currentUserVideoApproval.approvedAt)
      : null,
    isApproved,
    hasUnapprovedChanges: !isApproved && userVideoApprovals.length > 1,
  };
};
