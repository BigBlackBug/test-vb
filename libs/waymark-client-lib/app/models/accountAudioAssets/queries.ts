// Vendor
import { gql } from '@apollo/client';

import { GraphQLNode } from 'shared/types';
import { AudioSources } from './types';

export const accountAudioAssetFragment = gql`
  fragment AccountAudioAssetFields on AccountAudioAssetNode {
    id
    guid
    uploadKey
    length
    displayName
    source
  }
`;
export interface AccountAudioAssetNode extends GraphQLNode {
  guid: string;
  uploadKey: string;
  length: number;
  displayName: string;
  source: `${AudioSources}`;
}

export const accountAudioAssetQuery = gql`
  ${accountAudioAssetFragment}

  query AccountAudioAssetForUploadKey($uploadKey: String!) {
    accountAudioAssetForUploadKey(uploadKey: $uploadKey) {
      ...AccountAudioAssetFields
    }
  }
`;
export interface AccountAudioAssetQueryResult {
  accountAudioAssetForUploadKey: AccountAudioAssetNode | null;
}
