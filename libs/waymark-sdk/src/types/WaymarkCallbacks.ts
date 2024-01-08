import { z } from 'zod';
import { VideoData } from './VideoData';
import { WaymarkEventName } from './EventName';
import { GenericZodFunction } from './zodUtils';

const zodCallbackObject: {
  [key in WaymarkEventName]: typeof GenericZodFunction;
} = {
  waymarkOpened: GenericZodFunction,
  waymarkOpenFailed: GenericZodFunction,
  editorExited: GenericZodFunction,
  editorOpened: GenericZodFunction,
  editorOpenFailed: GenericZodFunction,
  videoCompleted: GenericZodFunction,
  videoCreated: GenericZodFunction,
  videoRendered: GenericZodFunction,
  videoSaved: GenericZodFunction,
  error: GenericZodFunction,
};

export const WaymarkCallbacksZod = z.object(zodCallbackObject).strict();

/**
 * @ignore Don't include this in the docs
 * Valid Waymark event callbacks that can be passed to the Waymark constructor or listened to via `waymark.on()`
 */
export interface WaymarkCallbacks extends z.infer<typeof WaymarkCallbacksZod> {
  /**
   * Called when the Waymark AI page has been opened
   */
  waymarkOpened: () => void;
  /**
   * Called when the Waymark AI page failed to open
   * @param error - The error that occurred
   */
  waymarkOpenFailed: (error: Error) => void;
  /**
   * Called when the Waymark editor has been closed
   */
  editorExited: () => void;
  /**
   * Called when the Waymark editor has been opened
   */
  editorOpened: (videoData: VideoData) => void;
  /**
   * Called when the Waymark editor failed to open
   */
  editorOpenFailed: (error: Error) => void;
  /**
   * Called when a video has been completed
   *
   * @param videoData - An object with data for the completed video
   */
  videoCompleted: (videoData: VideoData) => void;
  /**
   * Called when a new video has been saved to the user's account
   *
   * @param videoData - An object with data for the created video
   */
  videoCreated: (videoData: VideoData) => void;
  /**
   * Called when a video render has completed
   *
   * @param videoData - An object with data for the rendered video
   */
  videoRendered: (videoData: VideoData) => void;
  /**
   * Called when a new video is created or changes to an existing video are saved
   *
   * @param videoData - An object with data for the saved video
   */
  videoSaved: (videoData: VideoData) => void;
  /**
   * Called when an error occurs inside the Waymark iframe
   */
  error: (error: Error) => void;
}
