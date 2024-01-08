import Waymark from './Waymark';

// Provide both a default and named export for the Waymark class.
export default Waymark;
export { Waymark as Waymark };

export * from './Errors';

// Export useful types for consumers of the SDK.
export { AccountInfo, UpdatableAccountInfo } from './types/AccountInfo';
export {
  LoginAccountJWTPayload,
  LoginAccountData,
  CreateAccountJWTPayload,
  CreateAccountData,
  UpdateAccountInfoPayload,
} from './types/AccountPayload';
export { ChildFrameAPI } from './types/ChildFrameAPI';
export { EditorOptions } from './types/EditorOptions';
export { WaymarkEventName } from './types/EventName';
export { VideoData } from './types/VideoData';
export { WaymarkCallbacks } from './types/WaymarkCallbacks';
export { WaymarkOptions } from './types/WaymarkOptions';
