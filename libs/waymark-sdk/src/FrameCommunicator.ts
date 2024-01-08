import { connectToChild, Connection } from 'penpal';

import { EditorOptions } from './types/EditorOptions';
import { FrameParentAPI, FrameParentAPIZod } from './types/FrameParentAPI';
import { ChildFrameAPI } from './types/ChildFrameAPI';
import { UpdateAccountInfoPayload } from './types/AccountPayload';

interface FrameCommunicatorOptions {
  timeout?: number;
  editor: EditorOptions;
}

/**
 * @ignore
 * Class used on the SDK side to communicate with the Waymark page in the embedded iframe
 */
export default class FrameCommunicator implements ChildFrameAPI {
  private connection: Connection<ChildFrameAPI>;

  constructor(
    private iframe: HTMLIFrameElement,
    private partnerID: string,
    private options: FrameCommunicatorOptions,
  ) {
    // Methods which we will expose to the child iframe so it can communicate with the SDK
    const exposedAPIMethods: FrameParentAPI = {
      getPartnerID: async () => this.partnerID,
      getEditorOptions: async () => options.editor,
      sendEvent: async (eventName, eventData) => {
        document.dispatchEvent(new CustomEvent(`waymark:${eventName}`, { detail: eventData }));
      },
      sendError: async (errorCode: string, errorMessage: string) => {
        console.error(`Remote error: ${errorCode}: ${errorMessage}`);

        const error = new Error(errorMessage);
        error.name = errorCode;

        document.dispatchEvent(new CustomEvent('waymark:error', { detail: error }));
      },
    };

    // Create a penpal connection to the embedded child page
    this.connection = connectToChild<ChildFrameAPI>({
      iframe: this.iframe,
      // Penpal will not allow redirects to a different origin in the iframe without this
      // setting. Redirects can happen if the user is logged into a different Waymark site and
      // then visits a plugin or SDK site. A setting that only allowed subdomains would be
      // preferable; might be worth a PR to Penpal, and I've filed a feature request issue.
      childOrigin: '*',
      timeout: this.options.timeout,
      debug: true,
      methods: FrameParentAPIZod.parse(exposedAPIMethods),
    });
  }

  /**
   * Ensure the connection to the child iframe is established and returns
   * the connected child object which can be used to communicate with the iframe.
   */
  async waitForConnection() {
    return await this.connection.promise;
  }

  /**
   * Logs the user out and closes the embedded Waymark page,
   * then destroys the penpal connection.
   *
   * After this is run, the FrameCommunicator instance cannot be reused,
   * so a new one should be created if needed again.
   */
  async cleanup() {
    try {
      await this.close();
    } catch (e) {
      console.error('An error occurred while cleaning up Waymark iframe connection:', e);
    }
    await this.connection.destroy();
  }

  async createAccount(createAccountInfoJWTString: string) {
    const connectedChild = await this.waitForConnection();
    return await connectedChild.createAccount(this.partnerID, createAccountInfoJWTString);
  }
  async loginAccount(loginAccountInfoJWTString: string) {
    const connectedChild = await this.waitForConnection();
    return await connectedChild.loginAccount(this.partnerID, loginAccountInfoJWTString);
  }
  async logoutAccount() {
    const connectedChild = await this.waitForConnection();
    return await connectedChild.logoutAccount();
  }
  async getAccountInfo() {
    const connectedChild = await this.waitForConnection();
    return await connectedChild.getAccountInfo();
  }
  async updateAccountInfo(accountInfo: UpdateAccountInfoPayload) {
    const connectedChild = await this.waitForConnection();
    return await connectedChild.updateAccountInfo(accountInfo);
  }
  async openWaymark(options?: { businessURL?: string | null }) {
    const connectedChild = await this.waitForConnection();
    return await connectedChild.openWaymark(options);
  }
  async getVideos() {
    const connectedChild = await this.waitForConnection();
    return await connectedChild.getVideos();
  }
  async openEditorForVideo(videoID: string, shouldNavigateBackOnExit: boolean) {
    const connectedChild = await this.waitForConnection();
    return await connectedChild.openEditorForVideo(videoID, shouldNavigateBackOnExit);
  }
  async getVideoData(videoID: string) {
    const connectedChild = await this.waitForConnection();
    return await connectedChild.getVideoData(videoID);
  }
  async close() {
    const connectedChild = await this.waitForConnection();
    return await connectedChild.close();
  }
}
