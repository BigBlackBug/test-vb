import { ChildFrameAPI } from '@libs/waymark-sdk';

import { getAccountMethods } from './account';
import { getEditorMethods } from './editor';
import { getVideoMethods } from './videos';
import { getWaymarkMethods } from './waymark';

import { SDKStore } from '../types';

export const getFrameTranslatorAPIMethods = (get: () => SDKStore): ChildFrameAPI => ({
  ...getAccountMethods(get),
  ...getEditorMethods(get),
  ...getVideoMethods(),
  ...getWaymarkMethods(get),
});
