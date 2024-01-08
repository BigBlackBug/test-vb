import { Connection, connectToParent } from 'penpal';
import { InvalidParameterError } from './Errors';

import { FrameParentAPI } from './types/FrameParentAPI';
import { ChildFrameAPI, ChildFrameAPIZod } from './types/ChildFrameAPI';

/**
 * Shim to include in the embedded Waymark page so that it can
 * communicate with the SDK in the parent page.
 *
 * @private
 *
 * @param {ChildFrameAPI} methods   Methods which we will expose to the parent page so it can communicate
 *                                  with this embedded Waymark page.
 */
export default class FrameTranslator implements FrameParentAPI {
  private connection: Connection<FrameParentAPI>;
  private partnerID: string | null = null;

  constructor(methods: ChildFrameAPI) {
    // Ensure arrow functions are bound to the class instance
    this.sendEvent = this.sendEvent.bind(this);
    this.sendError = this.sendError.bind(this);

    try {
      // Create a penpal connection to the embedded child page
      this.connection = connectToParent<FrameParentAPI>({
        // Parse just to ensure we have all the required methods
        methods: ChildFrameAPIZod.parse(methods),
      });
    } catch (err) {
      throw new InvalidParameterError(`Error creating FrameTranslator: ${(err as Error).message}`);
    }
  }

  /**
   * Attempts to connect to the parent window via penpal
   *
   * @returns {Promise}   Returns a connection promise which will resolve when penpal has successfully connected to the parent
   */
  async waitForConnection() {
    return await this.connection.promise;
  }

  async getEditorOptions() {
    const connectedParent = await this.waitForConnection();
    return await connectedParent.getEditorOptions();
  }

  async getPartnerID() {
    const connectedParent = await this.waitForConnection();
    if (this.partnerID === null) {
      this.partnerID = await connectedParent.getPartnerID();
      console.info(`[Waymark] Partner ID: ${this.partnerID}`);
    }
    return this.partnerID;
  }

  sendError: FrameParentAPI['sendError'] = async (errorCode, errorMessage) => {
    const connectedParent = await this.waitForConnection();
    return await connectedParent.sendError(errorCode, errorMessage);
  };

  sendEvent: FrameParentAPI['sendEvent'] = async (eventName, eventData) => {
    const connectedParent = await this.waitForConnection();
    return await connectedParent.sendEvent(eventName, eventData);
  };
}
