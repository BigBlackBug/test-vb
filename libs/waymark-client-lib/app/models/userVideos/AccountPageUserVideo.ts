import { FormattedAccountPageUserVideoData, VoiceOverStatus, VideoApprovalRequest } from './types';
import {
  updateUserVideo,
  deleteUserVideo,
  makeUserVideoDraftCopy,
  createUserVideoApprovalRequest,
} from './mutations';

/**
 * Class representing a user video which includes all data needed to display the video on the
 * account page and provides interfaces for any mutations which can be performed on the video on the account page.
 */
export default class AccountPageUserVideo {
  guid: string;
  title: string;
  purchasedAt: Date | null;
  isPurchased: boolean;
  lastEditedDate: Date | null;

  lastEditableDate: Date | null;
  canEdit: boolean;

  variantName: string;
  duration: number;
  width: number;
  height: number;
  isWaymarkAuthorTemplate: boolean;

  businessName: string | null;

  thumbnailURL: string | null;

  voiceOverStatus: VoiceOverStatus | null;

  videoApproval: VideoApprovalRequest | null;

  constructor({
    guid,
    title,
    purchasedAt,
    lastEditedDate,
    lastEditableDate,
    variantName,
    duration,
    width,
    height,
    isWaymarkAuthorTemplate,
    businessName,
    thumbnailURL,
    voiceOverStatus,
    videoApproval,
  }: FormattedAccountPageUserVideoData) {
    this.guid = guid;
    this.title = title;

    this.variantName = variantName;
    this.duration = duration;
    this.width = width;
    this.height = height;
    this.isWaymarkAuthorTemplate = isWaymarkAuthorTemplate;

    this.businessName = businessName;

    this.purchasedAt = purchasedAt;
    this.isPurchased = Boolean(purchasedAt);

    this.lastEditedDate = lastEditedDate;

    this.lastEditableDate = lastEditableDate;
    this.canEdit = lastEditableDate ? lastEditableDate.getTime() > Date.now() : true;

    this.thumbnailURL = thumbnailURL;

    this.voiceOverStatus = voiceOverStatus;

    this.videoApproval = videoApproval;
  }

  /**
   * Updates the video's title
   *
   * @param {string} newTitle
   */
  async updateTitle(newTitle: string) {
    const result = await updateUserVideo(this.guid, { title: newTitle });

    if (!result) {
      throw new Error("Something went wrong while attempting to update the video's title.");
    }

    this.title = newTitle;
    return newTitle;
  }

  /**
   * Creates a video approval request for this video
   */
  async createApprovalRequest() {
    if (this.videoApproval) {
      throw new Error('Cannot create an approval request for a video that already has one');
    }

    const createdApprovalRequest = await createUserVideoApprovalRequest(this.guid);
    this.videoApproval = createdApprovalRequest;
    return createdApprovalRequest;
  }

  /**
   * Makes a new user video which is a copy of this video
   */
  async makeDraftCopy() {
    if (!this.isWaymarkAuthorTemplate) {
      throw new Error('Cannot make a draft copy of a legacy template');
    }

    await makeUserVideoDraftCopy(this.guid);
  }

  /**
   * Deletes this video if it's a draft
   */
  async delete() {
    if (this.isPurchased) {
      throw new Error('Cannot delete a purchased video');
    }

    await deleteUserVideo(this.guid);
  }
}
