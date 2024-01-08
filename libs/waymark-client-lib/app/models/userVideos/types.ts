export enum RenderedVideoStatus {
  initial = 'initial',
  inProgress = 'in_progress',
  succeeded = 'succeeded',
  failed = 'failed',
  aborted = 'aborted',
}

export enum RenderedVideoFormat {
  email = 'email',
  broadcastQuality = 'broadcast_quality',
  preview = 'preview',
}

export interface RenderedVideo {
  url: string | null;
  format: RenderedVideoFormat;
  status: RenderedVideoStatus;
  size: number | null;
}

export enum VoiceOverStatus {
  inProgress = 'inProgress',
  delivered = 'delivered',
}

export interface VideoApprovalRequest {
  createdAt: Date;
  fullName: string;
  approvedAt: Date | null;
  isApproved: boolean;
  hasUnapprovedChanges: boolean;
}

export interface PurchaseApprovalRequest {
  createdAt: Date;
  approvedAt: Date | null;
  isApproved: boolean;
}

export interface FormattedAccountPageUserVideoData {
  guid: string;
  title: string;
  purchasedAt: Date | null;
  lastEditedDate: Date | null;
  lastEditableDate: Date | null;
  variantName: string;
  duration: number;
  width: number;
  height: number;
  isWaymarkAuthorTemplate: boolean;
  businessName: string | null;
  thumbnailURL: string | null;
  voiceOverStatus: VoiceOverStatus | null;
  videoApproval: VideoApprovalRequest | null;
  purchaseApproval: PurchaseApprovalRequest | null;
}

export enum PurchasedUserVideoFilters {
  PurchasedDateDesc = 'purchasedDateDesc',
  PurchasedDateAsc = 'purchasedDateAsc',
  LastEditedDateDesc = 'lastEditedDateDesc',
  LastEditedDateAsc = 'lastEditedDateAsc',
  NameAsc = 'nameAsc',
  NameDesc = 'nameDesc',
  HasVoiceOver = 'hasVoiceOver',
}

// Type for a string which matches one of the values in the PurchasedUserVideoFilters enum
export type PurchasedUserVideoFilterValue = `${PurchasedUserVideoFilters}`;

export enum DraftUserVideoFilters {
  LastEditedDateDesc = 'lastEditedDateDesc',
  LastEditedDateAsc = 'lastEditedDateAsc',
  CreatedDateDesc = 'createdDateDesc',
  CreatedDateAsc = 'createdDateAsc',
  NameAsc = 'nameAsc',
  NameDesc = 'nameDesc',
}

// Type for a string which matches one of the values in the DraftUserVideoFilters enum
export type DraftUserVideoFilterValue = `${DraftUserVideoFilters}`;
