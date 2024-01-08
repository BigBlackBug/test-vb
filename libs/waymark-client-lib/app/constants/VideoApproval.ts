export const videoApprovalStates = {
  pending: 'pending',
  hasUnapprovedChanges: 'has_unapproved_changes',
  approved: 'approved',
} as const;

export type VideoApprovalState = (typeof videoApprovalStates)[keyof typeof videoApprovalStates];

export const videoApprovalStatusNames = {
  [videoApprovalStates.pending]: 'Awaiting approval',
  [videoApprovalStates.hasUnapprovedChanges]: 'Unapproved changes',
  [videoApprovalStates.approved]: 'Approved',
};
