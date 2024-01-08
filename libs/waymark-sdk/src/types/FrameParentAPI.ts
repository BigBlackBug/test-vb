import { z } from 'zod';

import { EditorOptions } from './EditorOptions';
import { WaymarkEventName } from './EventName';
import { GenericZodFunction } from './zodUtils';
import { WaymarkCallbacks } from './WaymarkCallbacks';

export const FrameParentAPIZod = z.object({
  getEditorOptions: GenericZodFunction,
  getPartnerID: GenericZodFunction,
  sendEvent: GenericZodFunction,
  sendError: GenericZodFunction,
});

/**
 * @ignore Don't include this in the docs
 * API methods available from the parent window that can be called by the child frame
 */
export interface FrameParentAPI extends z.infer<typeof FrameParentAPIZod> {
  /**
   * Gets the partner ID that the SDK is initialized with
   */
  getPartnerID: () => Promise<string>;
  /**
   * Gets the editor config options passed to the Waymark constructor in the parent window
   */
  getEditorOptions: () => Promise<EditorOptions>;
  /**
   * Sends an event to the parent window
   *
   * @param eventName - The name of the event to send
   * @param eventData - Data to send with the event
   */
  sendEvent: <TEventName extends WaymarkEventName>(
    eventName: TEventName,
    eventData?: Parameters<WaymarkCallbacks[TEventName]>[0],
  ) => Promise<void>;
  /**
   * Sends an error to the parent window
   *
   * @param errorCode - The error code to send
   * @param errorMessage - The error message to send
   */
  sendError: (errorCode: string, errorMessage: string) => Promise<void>;
}
