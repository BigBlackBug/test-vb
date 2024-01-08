import { z } from 'zod';
import { AccountInfo, UpdatableAccountInfo } from './AccountInfo';
import { VideoData } from './VideoData';
import { GenericZodFunction } from './zodUtils';

// Just defining each method as a bare generic Zod function so Zod doesn't mangle any internal workings
// of the method; we'll define proper param and return types for each method on the interface below
export const ChildFrameAPIZod = z.object({
  createAccount: GenericZodFunction,
  loginAccount: GenericZodFunction,
  logoutAccount: GenericZodFunction,
  getAccountInfo: GenericZodFunction,
  updateAccountInfo: GenericZodFunction,
  openWaymark: GenericZodFunction,
  getVideos: GenericZodFunction,
  getVideoData: GenericZodFunction,
  openEditorForVideo: GenericZodFunction,
  close: GenericZodFunction,
});

export interface WaymarkTemplateCollection {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  templateCount: number;
}

export interface WaymarkTemplate {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  aspectRatio: string;
  duration: number;
  height: number;
  width: number;
  licensing: 'tv' | 'digital' | 'full';
  previewVideoURL: string;
  thumbnailImageURL: string;
}

type InferredChildFrameAPIZod = z.infer<typeof ChildFrameAPIZod>;

/**
 * @ignore Don't include this in the docs
 * API methods available from the child frame which can be called by the parent window
 */
export interface ChildFrameAPI extends InferredChildFrameAPIZod {
  /**
   * Create a new account with the given account info encoded in a JWT
   *
   * @param partnerID - The partner ID of the SDK integrator
   * @param accountInfoJWT - A JWT containing the account info to use for the new account
   *
   * @returns The newly created account's ID
   */
  createAccount: (partnerID: string, accountInfoJWT: string) => Promise<string>;
  /**
   * Log into an existing account with the given account info encoded in a JWT
   *
   * @param partnerID - The partner ID of the SDK integrator
   * @param accountInfoJWT - A JWT containing the account info to use for the new account
   *
   * @returns An object with the account's info
   */
  loginAccount: (partnerID: string, accountInfoJWT: string) => Promise<AccountInfo>;
  /**
   * Logs the user out of their Waymark account
   */
  logoutAccount: () => Promise<void>;
  /**
   * Gets the logged-in account's info
   *
   * @returns An object with the account's info
   */
  getAccountInfo: () => Promise<AccountInfo>;
  /**
   * Updates the logged-in account's info
   * @param accountInfo - An object with new values to update the account with
   *
   * @returns An object with the account's updated info
   */
  updateAccountInfo: (accountInfo: UpdatableAccountInfo) => Promise<AccountInfo>;
  /**
   * Opens the Waymark /ai page
   */
  openWaymark: (options?: { businessURL?: string | null }) => Promise<void>;
  /**
   * Gets the logged-in account's saved/purchased videos
   *
   * @returns An array of objects with the account's videos
   */
  getVideos: () => Promise<VideoData[]>;
  /**
   * Opens the Waymark editor for a given video
   * @param {string} videoID - The ID of the video to open the editor for
   * @param {boolean} shouldNavigateBackOnExit - Whether or not to navigate back to the /ai page when the editor is closed
   */
  openEditorForVideo: (videoID: string, shouldNavigateBackOnExit: boolean) => Promise<void>;
  /**
   * Gets data for a given video
   * @param {string} videoID - The ID of the video to get data for
   */
  getVideoData: (videoID: string) => Promise<VideoData | null>;
  /**
   * Closes any open Waymark page
   */
  close: () => Promise<void>;
}
