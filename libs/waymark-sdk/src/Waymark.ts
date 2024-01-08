import FrameCommunicator from './FrameCommunicator';
import { InvalidParameterError, InvalidJWTError } from './Errors';
import {
  AuthMode,
  EnvironmentPresets,
  WaymarkOptions,
  WaymarkOptionsZod,
} from './types/WaymarkOptions';
import { WaymarkEventName } from './types/EventName';
import { WaymarkCallbacks } from './types/WaymarkCallbacks';
import {
  CreateAccountJWT,
  LoginAccountJWT,
  UpdateAccountInfoPayload,
  UpdateAccountInfoPayloadZod,
} from './types/AccountPayload';
import { EditorOptions } from './types/EditorOptions';
import { VideoData } from './types/VideoData';

const DEFAULT_ENVIRONMENT = 'prod';

// Mappings of environment names to their host domain URLs
const ENVIRONMENTS: {
  [key in EnvironmentPresets]: {
    host: string;
  };
} = {
  demo: {
    host: 'https://demo.waymark.com',
  },
  prod: {
    host: 'https://waymark.com',
  },
  local: {
    host: 'https://localhost:8000',
  },
};

declare global {
  interface DocumentEventMap {
    // Add waymark events to the global document event map
    // so TS will recognize them as valid event names.
    'waymark:waymarkOpened': CustomEvent<undefined>;
    'waymark:waymarkOpenFailed': CustomEvent<Error>;
    'waymark:editorExited': CustomEvent<undefined>;
    'waymark:editorOpened': CustomEvent<VideoData | null>;
    'waymark:editorOpenFailed': CustomEvent<Error>;
    'waymark:videoCompleted': CustomEvent<VideoData>;
    'waymark:videoCreated': CustomEvent<VideoData>;
    'waymark:videoRendered': CustomEvent<VideoData>;
    'waymark:videoSaved': CustomEvent<VideoData>;
    'waymark:error': CustomEvent<Error>;
  }
}

/**
 * Instruments an instance with logging of method arguments and return values.
 *
 * @private
 */
function sdkDebug(target: Waymark) {
  // Loop through all of the properties of the SDK instance.
  for (const propertyName of Reflect.ownKeys(target)) {
    const descriptor = Object.getOwnPropertyDescriptor(target, propertyName);

    // Only decorate the functions.
    if (!(descriptor?.value instanceof Function)) {
      continue;
    }

    const originalMethod = descriptor.value;

    // Replace the original with a wrapper that logs the arguments and return values.
    descriptor.value = function (...args: unknown[]) {
      const methodName = propertyName.toString();
      console.log(`SDK ${methodName}(${JSON.stringify(args)})`);

      // Call the original method with the arguments.
      const result = originalMethod.apply(this, args);

      try {
        if (result instanceof Promise) {
          // Promises will be logged when they resolve or catch.
          result
            .then((promiseResult) => {
              console.log(`SDK ${methodName} :: ${JSON.stringify(promiseResult)}`);
              return promiseResult;
            })
            .catch((error) => {
              console.log(`SDK ${methodName} !! ${error}`);
            });
        } else {
          // Everything else gets logged immediately.
          console.log(`SDK ${methodName} -> ${JSON.stringify(result)}`);
        }
      } catch (logError) {
        console.error('SDK Error while logging results:', logError);
      }

      return result;
    };

    // Replace the existing method definition with the instrumented method.
    Object.defineProperty(target, propertyName, descriptor);
  }

  return target;
}

/**
 * The Waymark integration class.
 *
 * @class Waymark
 *
 * @param {string} partnerID - The Waymark-provided partner ID
 *
 * @param {Object} options - Additional configuration options
 * @param {string|Object} [options.environment="prod"] - An environment (host) name or custom environment object with a defined host. Valid environment names are "demo", "prod", and "local", default is "demo". Custom environment object should be structured as { host: 'https://localhost:8080' }.
 * @param {Object} [options.callbacks] - An optional object containing callback functions keyed by the
 * name of the Waymark event. These callbacks can also be added using {@link Waymark#on|Waymark.on}
 * @param {DOMElement} [options.domElement] - An optional DOM element on the page that will serve as the
 * container for the Waymark UI. If not provided then an element will be appended to the end
 * of the document the first time a UI method is called.
 *
 * @param {Object} [options.editor] - Optional editor configuration.
 *
 * @param {Object} [options.editor.labels] - Override labels within the editor.
 *
 * @param {Object} [options.editor.labels.completeVideoConfirmation] - Configuration for an optional confirmation modal that will pop up when the user clicks the complete button.
 * @param {boolean} [options.editor.labels.completeVideoConfirmation.shouldShow=false] - Whether the editor should show a confirmation modal when the user clicks the complete button.
 * @param {string} [options.editor.labels.completeVideoConfirmation.title="Finalize Video"] - The title to display at the top of the confirmation modal.
 * @param {string} [options.editor.labels.completeVideoConfirmation.body="By finalizing this video, you confirm that you own the rights to all of its content."] - The body text of the confirmation modal.
 * @param {string} [options.editor.labels.completeVideoConfirmation.confirmButton="Confirm"] - The label for the modal's confirmation button which will proceed to complete the video.
 * @param {string} [options.editor.labels.completeVideoConfirmation.cancelButton="Cancel"] - The label for the modal's cancel button which will close the modal.
 *
 * @param {boolean} [options.isDebug=false] - Enables extra debugging console logs.
 *
 * @throws {InvalidParameterError} Thrown if:
 * - A partner ID was not provided.
 * - options.editor is incorrectly configured.
 * - Invalid events are provided in options.callbacks.
 * - Operation payloads are incorrect (number instead of string, etc.) or incomplete.
 * - Invalid environment key.
 *
 * @example
 * // The account is logged in via the createAccount() or loginAccount() methods.
 * const options = {
 *   callbacks: {
 *     editorExited: () => {
 *       console.log("The user exited the editor");
 *     },
 *     editorOpened: (videoData) => {
 *       console.log("The editor opened");
 *     },
 *     editorOpenFailed: (error) => {
 *       console.log("The editor failed to open");
 *     },
 *     videoCompleted: (video) => {
 *       console.log("A video was completed:", video);
 *     },
 *     videoCreated: (video) => {
 *       console.log("A video was created:", video);
 *     },
 *     videoRendered: (video) => {
 *       console.log("A video was rendered:", video);
 *     },
 *     videoSaved: (video) => {
 *       console.log("A video was saved:", video);
 *     }
 *   },
 *   editor: {
 *     orientation: "right",
 *     labels: {
 *       exitEditor: "Cancel",
 *       completeVideo: "N
 *   ",xx
  }
 *   },
 *   environment: "prod",
 * }
 * const waymark = new Waymark('partnerID', options);
 */
class Waymark {
  partnerID: string;
  domElement: HTMLElement;
  // Don't allow the authMode to be changed after initialization; otherwise this could be manipulated
  // to get the user's personal account information via `getAccountInfo()`
  private readonly authMode: AuthMode;
  editorOptions: EditorOptions;
  connectionDomain: string;

  iframe: HTMLIFrameElement | null = null;
  frameCommunicator: FrameCommunicator | null = null;

  constructor(partnerID: string, options: WaymarkOptions = {}) {
    if (!partnerID) {
      throw new InvalidParameterError(
        'A partnerID must be provided. Please contact Waymark if you have not been given your PartnerID.',
      );
    }

    this.partnerID = partnerID;

    // Parse the options with zod to make sure they're valid
    const parsedOptions = WaymarkOptionsZod.safeParse(options);
    if (parsedOptions.success === false) {
      throw new InvalidParameterError(
        `Invalid options object provided:\n${parsedOptions.error.message}`,
      );
    }

    const {
      authMode = 'jwt',
      domElement = null,
      callbacks = null,
      editor = {},
      environment = DEFAULT_ENVIRONMENT,
      isDebug = false,
    } = parsedOptions.data;

    if (domElement) {
      this.domElement = domElement;
    } else {
      // If no DOM element was provided, create a new one and append it to the document body.
      this.domElement = document.createElement('div');
      document.body.appendChild(this.domElement);
    }

    this.authMode = authMode;

    this.editorOptions = editor;

    // Get the connection domain for the provided environment
    this.connectionDomain = Waymark.getConnectionDomain(environment);

    // Register event listeners for all provided callbacks
    if (callbacks) {
      Object.entries(callbacks).forEach(([event, callback]) => {
        // Subscribe to the event and register the callback with Waymark.on.
        this.on(event as WaymarkEventName, callback as WaymarkCallbacks[keyof WaymarkCallbacks]);
      });
    }

    if (isDebug) {
      // Attach debug instrumentation to the Waymark instance
      sdkDebug(this);
    }
  }

  /**
   * Determines host based on environment slug or object.
   *
   * @param {string|object} environment: Environment slug or object with custom host.
   *
   * @private
   */
  static getConnectionDomain(
    environment: WaymarkOptions['environment'] = DEFAULT_ENVIRONMENT,
  ): string {
    if (!environment) {
      throw new InvalidParameterError(
        `Invalid environment option provided to Waymark: ${environment}`,
      );
    }

    if (typeof environment === 'string') {
      return ENVIRONMENTS[environment].host;
    } else {
      return environment.host;
    }
  }

  /**
   * Set up the Waymark iframe and cross-frame communication system. The iframe will be created
   * within either the partner-provided DOM element or a newly-created element added to the end
   * of the document.
   *
   * @private
   */
  getFrameCommunicator() {
    if (!this.frameCommunicator) {
      // Create and set up the iframe element
      let didCreateIframe = false;
      if (!this.iframe) {
        didCreateIframe = true;

        this.iframe = document.createElement('iframe');
        this.iframe.style.width = '100%';
        this.iframe.style.height = '100%';
        this.iframe.style.border = 'none';
        // Necessary to allow opening the renderer in full screen
        this.iframe.setAttribute('allowfullscreen', '');
      }

      const connectionURL = new URL('/sdk/', this.connectionDomain);
      connectionURL.searchParams.set('mode', 'embed');
      connectionURL.searchParams.set('partnerid', this.partnerID);
      connectionURL.searchParams.set('auth', this.authMode);

      this.iframe.src = connectionURL.href;

      if (didCreateIframe) {
        this.domElement.appendChild(this.iframe);
      }

      // Create a FrameCommunicator instance which will expose APIs for communicating with
      // the embedded Waymark page in the iframe.
      this.frameCommunicator = new FrameCommunicator(this.iframe, this.partnerID, {
        editor: this.editorOptions,
      });
    }

    return this.frameCommunicator;
  }

  /**
   * Create a new Waymark account for a user. The account enables the user to create and edit
   * videos. This method will also log the user into the new account.
   *
   * An external ID can be provided to allow you to associate the Waymark account with an
   * internal account.
   *
   * See {@link Authentication} for details on authentication methods.
   *
   * @param {string} accountInfo - A JWT with encoded account creation information if using {@link #sso-jwt-authentication|JWT authentication}, or an unencoded
   * {@link #data-type-video-template|account data object} if {@link #sso-api-key-authentication|API key authentication} is being used.
   *
   * @returns {Promise} - A promise that resolves with the new account's ID when the account has been created.
   *
   * @throws {AccountAlreadyExistsError} An account with the given external ID already exists.
   * @throws {InvalidJWTError} The JWT token was invalid.
   *
   * @example
   * // For JWT authentication usage, first create the JWT with the encoded account
   * // information on the server. Then call createAccount() with the JWT and wait
   * // for the update to complete.
   * try {
   *   const accountID = await waymark.createAccount(accountInfo);
   *   console.log("Successful account creation. New ID:", accountID);
   * } catch(error) {
   *   console.log(error);
   * }
   *
   * // Alternative Promise syntax
   * waymark.createAccount(accountInfo)
   *   .then((accountID) => {
   *     console.log("Successful account creation. New ID:", accountID);
   *   })
   *   .catch((error) => {
   *     console.log("Unsuccessful account creation.", error);
   *   });
   *
   */
  async createAccount(accountInfo: string) {
    if (this.authMode === 'uncontrolled') {
      throw new Error('createAccount() cannot be called when authMode is set to "uncontrolled".');
    }

    try {
      // Ensure the payload is valid, and if it's not, throw an error
      const accountInfoJWTPayload = await CreateAccountJWT.parseAsync(accountInfo);
      if (accountInfoJWTPayload.iss !== this.partnerID) {
        throw new InvalidParameterError(
          'expected `iss` to match the partner ID provided to the SDK.',
        );
      }
    } catch (err) {
      throw new InvalidJWTError(`Invalid createAccount payload:\n${(err as Error).message}\n`);
    }

    try {
      return this.getFrameCommunicator().createAccount(accountInfo);
    } catch (error) {
      if ((error as Error).name === 'ExistingLoginError') {
        // An account was already loaded in the session so we need to
        // log them out first, reload the iframe, and try again.
        console.log('Existing login, logging current user out and reinitializing.');
        await this.logoutAccount();
        await this.frameCommunicator?.cleanup();
        this.frameCommunicator = null;

        // Try the operation again.
        return this.getFrameCommunicator().createAccount(accountInfo);
      }

      // Not an existing user problem so rethrow the error.
      throw error;
    }
  }

  /**
   * Login an existing Waymark account for a user.
   *
   * See {@link Authentication} for details on authentication methods.
   *
   * @param {string} accountInfo - A JWT with encoded account login information, or an
   * unencoded accountInfo object if using API key authentication. An external ID may
   * be used to login the account instead if one was provided at account creation time.
   * @param {string} [accountInfo.accountID] The Waymark account ID, OR
   * @param {string} [accountInfo.externalID] The external ID provided at account creation
   *
   * @returns {Promise} - A promise that resolves when the account has been successfully logged
   in.
   *
   * @throws {AccountDoesNotExistError} An account with the given ID does not exist.
   * @throws {InvalidJWTError} The JWT token was invalid.
   *
   * @example
   * // First, create the JWT with the encoded account information on the server.
   * // Call loginAccount() with the JWT and wait for the operation to complete.
   * try {
   *   await waymark.loginAccount(accountInfo);
   *   console.log("Successful account login.");
   * } catch(error) {
   *   console.log("Unsuccessful login", error);
   * }
   *
   * // Alternative Promise syntax
   * waymark.loginAccount(accountInfo)
   *   .then(() => {
   *     console.log("Successful account login.");
   *   })
   *   .catch((error) => {
   *     console.log("Unsuccessful login", error);
   *   });
   *
   */
  async loginAccount(accountInfo: string) {
    if (this.authMode === 'uncontrolled') {
      throw new InvalidParameterError(
        'loginAccount() cannot be called when authMode is set to "uncontrolled".',
      );
    }

    try {
      const accountInfoJWTPayload = await LoginAccountJWT.parseAsync(accountInfo);
      if (accountInfoJWTPayload.iss !== this.partnerID) {
        throw new Error('expected `iss` to match the partner ID provided to the SDK.');
      }
    } catch (err) {
      throw new InvalidJWTError(`Invalid loginAccount payload:\n${(err as Error).message}\n`);
    }

    try {
      return this.getFrameCommunicator().loginAccount(accountInfo);
    } catch (error) {
      if ((error as Error).name === 'ExistingLoginError') {
        // An account was already loaded in the session so we need to
        // log them out first, reload the iframe, and try again.
        await this.logoutAccount();
        await this.frameCommunicator?.cleanup();
        this.frameCommunicator = null;

        // Try the operation again.
        return this.getFrameCommunicator().loginAccount(accountInfo);
      }

      // Not an existing user problem so rethrow the error.
      throw error;
    }
  }

  /**
   * Log the current user out of Waymark.
   *
   * @returns {Promise} - A promise that resolves when the account has been successfully logged
   out.
   *
   */
  async logoutAccount() {
    if (this.authMode === 'uncontrolled') {
      throw new InvalidParameterError(
        'logoutAccount() cannot be called when authMode is set to "uncontrolled".',
      );
    }

    return this.getFrameCommunicator().logoutAccount();
  }

  /**
   * Returns the account information for the current account. The Waymark SDK must be
   * first authenticated via the {@link Waymark#createAccount|Waymark.createAccount} or {@link Waymark#loginAccount|Waymark.loginAccount}
   * methods, or by logging in directly via the Waymark UI.
   *
   * @returns {Promise<Object>} - A promise that resolves with the {@link #data-type-account|account information} Waymark
   * maintains for the current account.
   *
   * @throws {InvalidAccountError} The account does not exist.
   * @throws {AccountMustBeAuthenticatedError} An account has not yet been authenticated.
   *
   * @example
   * // The account is logged in via the create account API.
   * const waymark = new Waymark('partnerID', options);
   * console.log(waymark.getAccountInfo());
   * {
   *   id: "1234-ABCD-1234-ABCD",
   *   externalID: "1234567890ABC",
   *   createdAt: "2019-08-08T16:22:38.924635Z",
   *   updatedAt: "2020-12-01T18:15:06.501702Z",
   *   firstName: "Mabel",
   *   lastName: "Tierney",
   *   emailAddress: "mtierney@example.com",
   *   companyName: "Tierney Auto, Inc.",
   *   phone: "248-555-1212",
   *   city: "Dearborn",
   *   state: "MI",
   * }
   */
  async getAccountInfo() {
    if (this.authMode === 'uncontrolled') {
      throw new Error("getAccountInfo() cannot be called when authMode is set to 'uncontrolled'.");
    }
    return this.getFrameCommunicator().getAccountInfo();
  }

  /**
   * Updates the account information Waymark maintains for the given account ID. The Waymark
   * SDK must be first authenticated via the {@link Waymark#createAccount|Waymark.createAccount} or {@link Waymark#loginAccount|Waymark.loginAccount}
   * methods, or by logging in directly via the Waymark UI.
   *
   * @param {Object} data - The data to update for the account. No fields are required.
   * @param {string} [data.externalID] - The external ID the partner uses for this account.
   * @param {string} [data.firstName] - The first name of the account holder.
   * @param {string} [data.lastName] - The last name of the account holder.
   * @param {string} [data.emailAddress] - The email address of account holder.
   * @param {string} [data.companyName] - The company name of the account holder.
   * @param {string} [data.phone] - The phone number of the account holder. This will be
   * normalized to xxx-xxx-xxxx.
   * @param {string} [data.city] - The city of the account holder.
   * @param {string} [data.state] - The 2-character state abbreviation of the account holder.
   *
   * @returns {Promise} - A promise that resolves when the account has been updated.
   *
   * @throws {InvalidAccountError} The account does not exist.
   * @throws {AccountMustBeAuthenticatedError} An account has not yet been authenticated.
   *
   * @example
   * const newInfo = {
   *   firstName: "Mabel",
   *   lastName: "Tierney",
   *   emailAddress: "mtierney@example.com",
   *   companyName: "Tierney Auto, Inc.",
   *   phone: "248-555-1212",
   *   city: "Dearborn",
   *   state: "MI",
   * }
   *
   * // Wait for the update to complete.
   * try {
   *   await waymark.updateAccountInfo(newInfo);
   * } catch(error) {
   *   console.log(error);
   * }
   *
   * // Alternative Promise syntax
   * waymark.updateAccountInfo(newInfo)
   *   .then(() => {
   *     console.log("Successful update.");
   *   })
   *   .catch((error) => {
   *     console.log("Unsuccessful update", error);
   *   });
   */
  async updateAccountInfo(newAccountInfo: UpdateAccountInfoPayload) {
    if (this.authMode === 'uncontrolled') {
      throw new Error(
        "updateAccountInfo() cannot be called when authMode is set to 'uncontrolled'.",
      );
    }

    const validatedAccountInfo = UpdateAccountInfoPayloadZod.safeParse(newAccountInfo);

    if (validatedAccountInfo.success === false) {
      throw new InvalidParameterError(
        `Invalid info passed to updateAccountInfo.\n${validatedAccountInfo.error.name}: ${validatedAccountInfo.error.message}`,
      );
    }

    return this.getFrameCommunicator().updateAccountInfo(validatedAccountInfo.data);
  }

  /**
   * Opens the Waymark UI on the AI video generation page.
   * The Waymark SDK must be first authenticated via the {@link Waymark#createAccount|Waymark.createAccount} or {@link Waymark#loginAccount|Waymark.loginAccount}
   * methods, or by logging in directly via the Waymark UI.
   *
   * @param {Object} [options] - Options for opening the Waymark UI.
   * @param {string} [options.businessURL] - A business URL which the Waymark AI page will use to auto-populate the brand search form and kick off a search.
   *                                          If not provided, the user will be able to type their business URL into the search form themselves.
   * @param {number} [options.timeout] - The number of milliseconds to wait for the Waymark UI to open before rejecting the promise.
   *
   * @returns {Promise} A promise which resolves when the UI has opened.
   */
  async openWaymark(options?: { businessURL?: string | null; timeout?: number }): Promise<void> {
    return new Promise((resolve, reject) => {
      let timeoutID: number;

      function onWaymarkOpened(this: Waymark) {
        clearTimeout(timeoutID);
        resolve();
        this.off('waymarkOpened', onWaymarkOpened);
        this.off('waymarkOpenFailed', onWaymarkOpenFailed);
      }
      this.on('waymarkOpened', onWaymarkOpened.bind(this));

      function onWaymarkOpenFailed(this: Waymark, error: Error) {
        reject(error);
        this.off('waymarkOpened', onWaymarkOpened);
        this.off('waymarkOpenFailed', onWaymarkOpenFailed);
      }
      this.on('waymarkOpenFailed', onWaymarkOpenFailed.bind(this));

      if (options?.timeout) {
        timeoutID = window.setTimeout(() => {
          onWaymarkOpenFailed.call(this, new Error('Timed out waiting for waymark to open.'));
        }, options.timeout);
      }

      this.showIframe();
      return this.getFrameCommunicator().openWaymark({
        businessURL: options?.businessURL,
      });
    });
  }

  /**
   * Returns an array of all of the videos for an account. The Waymark SDK must be
   * first authenticated via the {@link Waymark#createAccount|Waymark.createAccount} or {@link Waymark#loginAccount|Waymark.loginAccount}
   * methods, or by logging in directly via the Waymark UI.
   *
   * @returns {Promise<Array>} A promise that resolves with the array of {@link #data-type-video|videos}.
   *
   * @throws {AccountMustBeAuthenticatedError} An account has not yet been authenticated.
   *
   * @example
   * console.log(await waymark.getVideos());
   * [
   *   {
   *     id: "ABCD-1234-ABCD-1234",
   *     createdAt: Date(),
   *     updatedAt: Date(),
   *     isPurchased: true,
   *     name: "My Dealership Branding Video",
   *     templateID: "BCDE-2345-BCDE-2345",
   *     renders: [
   *       {
   *         renderedAt: Date(),
   *         format: "broadcast_quality",
   *         url: "https://videos.waymark.com/ABCD-1234-ABCD-1234.mov"
   *       }
   *     ]
   *   }
   * ]
   */
  async getVideos() {
    return this.getFrameCommunicator().getVideos();
  }

  /**
   * Fetches the latest data for a single video by ID. The Waymark SDK must be
   * first authenticated via the {@link Waymark#createAccount|Waymark.createAccount} or {@link Waymark#loginAccount|Waymark.loginAccount}
   * methods, or by logging in directly via the Waymark UI.
   *
   * @param {string} videoID - The ID of the video
   *
   * @return {Promise<VideoData | null>} A promise that resolves with the video's data, or null
   *                                     if the video does not exist or does not belong to the logged-in account.
   */
  async getVideoData(videoID: string): Promise<VideoData | null> {
    if (typeof videoID !== 'string') {
      throw new InvalidParameterError('getVideo requires a valid string for the video ID.');
    }

    return this.getFrameCommunicator().getVideoData(videoID);
  }

  /**
   * Open the Waymark video editor UI for an existing video.
   *
   * Note: The UI itself will not manage its visibility state; this should be managed by the
   * partner application via the parent DOM element provided when instantiating the {@link
   * Waymark} object.
   *
   * @param {string} videoID - The ID of the video, as in {@link Waymark#getVideos|Waymark.getVideos}.
   *
   * @returns {Promise} A promise that resolves with the account when the UI has been initialized.
   *
   * @throws {BrowserCompatibilityError} The user's browser cannot run the Waymark editor.
   *
   * @example
   * // The account is logged in via the create account API.
   * const options = {
   *   editor: {
   *     orientation: "right",
   *     labels: {
   *       exitEditor: "Cancel",
   *       completeVideo: "Next",
   *     }
   *   }
   * }
   * const waymark = new Waymark('partnerID', options);
   * const accountID = await waymark.createAccount(accountInfo);
   *
   * // Wait for the UI to initialize.
   * try {
   *   await waymark.openEditorForVideo("ABCD-1234-ABCD-1234");
   * } catch(error) {
   *   console.log(error);
   * }
   *
   * // Alternative Promise syntax
   * waymark.openEditorForVideo("ABCD-1234-ABCD-1234")
   *   .then(() => {
   *     console.log("The editor is now available.");
   *   })
   *   .catch((error) => {
   *     console.log("An error occurred while initializing the editor:", error);
   *   });
   */
  async openEditorForVideo(
    videoID: string,
    options?: {
      timeout?: number;
      // Whether the editor should navigate back to the video list when the user exits the editor
      shouldNavigateBackOnExit?: boolean;
    },
  ): Promise<void> {
    if (typeof videoID !== 'string') {
      throw new InvalidParameterError(
        'openEditorForVideo requires a valid string for the video ID.',
      );
    }

    return new Promise((resolve, reject) => {
      let timeoutID: number;

      function onEditorOpened(this: Waymark) {
        clearTimeout(timeoutID);
        resolve();
        this.off('editorOpened', onEditorOpened);
        this.off('editorOpenFailed', onEditorOpenFailed);
      }
      this.on('editorOpened', onEditorOpened.bind(this));

      function onEditorOpenFailed(this: Waymark, error: Error) {
        reject(error);
        this.off('editorOpened', onEditorOpened);
        this.off('editorOpenFailed', onEditorOpenFailed);
      }
      this.on('editorOpenFailed', onEditorOpenFailed.bind(this));

      if (options?.timeout) {
        timeoutID = window.setTimeout(() => {
          onEditorOpenFailed.call(this, new Error('Timed out waiting for editor to open.'));
        }, options.timeout);
      }

      this.showIframe();
      return this.getFrameCommunicator().openEditorForVideo(
        videoID,
        options?.shouldNavigateBackOnExit ?? false,
      );
    });
  }

  // Tracks registered event listeners so they can be removed later
  private listeners: {
    [key in WaymarkEventName]?: Map<
      // Map keys are the raw callback methods passed to on() and values are the wrapper methods which
      // are actually registered as event listeners on the document
      WaymarkCallbacks[keyof WaymarkCallbacks],
      (event: CustomEvent) => void
    >;
  } = {};

  /**
   * Subscribe to browser-side SDK events.
   *
   * These events will be fired by actions taken by the user within the UI. There
   * are also [webhooks](#webhooks) that will be fired for server-side processes.
   *
   * Valid events are:
   * - `editorExited()`: the user has exited the editor
   * - `editorOpened({VideoObject})`: the editor has successfully opened
   * - `editorOpenFailed(error)`: the editor failed to open successfully
   * - `error(error)`: an error has occurred
   * - `videoCompleted({VideoObject})`: the user has completed a video
   * - `videoCreated({VideoObject})`: the user has created a video and saved it for the first time
   * - `videoRendered({VideoObject})`: a completed video has finished rendering
   * - `videoSaved({VideoObject})`: the user has saved a video (also called on creation)
   * - `waymarkOpened()`: the Waymark UI has opened
   * - `waymarkOpenFailed()`: the Waymark UI failed to open
   *
   * @param {string} eventName - The name of the event to listen to.
   * @param {function} callback - The callback function to call when the event is fired.
   *
   * @returns {() => void} A function that can be called to remove the event listener. You can use Waymark.off(eventName, callback) to remove the listener as well if you prefer that.
   *
   * @example
   * const unsubscribe = waymark.on('waymarkOpened', () => {
   *  console.log("The Waymark UI has opened.");
   * });
   * // Later, remove the listener
   * unsubscribe();
   *
   * // Alternatively, you can use Waymark.off(eventName, callback) to remove the listener
   * const onWaymarkOpened = () => {};
   * waymark.on('waymarkOpened', onWaymarkOpened);
   * // Remove the listener with waymark.off
   * waymark.off('waymarkOpened', onWaymarkOpened);
   */
  on<TEvent extends WaymarkEventName>(
    eventName: TEvent,
    callback: WaymarkCallbacks[TEvent],
  ): () => void {
    let listenerCallbacks = this.listeners[eventName];
    if (!listenerCallbacks) {
      listenerCallbacks = new Map();
      this.listeners[eventName] = listenerCallbacks;
    }

    // If the callback is already registered, don't register it again
    if (!listenerCallbacks.has(callback)) {
      // Wrap the callback with an event listener method which can take the CustomEvent and pass along
      // any detail data
      const listenerCallback = (e: CustomEvent) => {
        // Cast callback as a generic function that takes any argument because navigating the
        // typings for this gets just a little too sticky otherwise
        (callback as (arg: unknown) => void)(e.detail);
      };

      listenerCallbacks.set(callback, listenerCallback);
      document.addEventListener(`waymark:${eventName}`, listenerCallback);
    }

    return () => this.off(eventName, callback);
  }

  /**
   * Remove an SDK event listener that was set up with {@link Waymark#on|Waymark.on}
   *
   * @param {string} event - The name of the event to unsubscribe from
   * @param {function} callback - The callback function that was originally passed to {@link Waymark#on|Waymark.on}
   */
  off<TEvent extends WaymarkEventName>(event: TEvent, callback: WaymarkCallbacks[TEvent]) {
    const listenerCallbacks = this.listeners[event];
    if (!listenerCallbacks) {
      return;
    }

    const listenerCallback = listenerCallbacks.get(callback);
    if (listenerCallback) {
      // If the provided callback is registered, remove the listener and delete the callback
      // from our listener registry
      document.removeEventListener(`waymark:${event}`, listenerCallback);
      listenerCallbacks.delete(callback);
    }
  }

  /**
   * Hide iframe instance in DOM and preserve its state.
   *
   * @private
   */
  hideIframe() {
    if (this.iframe) {
      this.iframe.style.visibility = 'hidden';
    }
  }

  /**
   * Shows hidden iframe instance.
   *
   * @private
   */
  showIframe() {
    if (this.iframe) {
      this.iframe.style.visibility = 'visible';
    }
  }

  /**
   *
   * Close the Waymark UI but retain any resources in use. Any in-progress videos will be
   * saved as drafts. If you want to close the UI and completely clean up all resources used
   * by the Waymark UI, use {@link Waymark#cleanup|Waymark.cleanup}.
   *
   * @returns {Promise} A promise that resolves when the UI has closed.
   */
  async close() {
    this.hideIframe();

    // Cleanup and preserve any in-progress resources.
    if (this.frameCommunicator) {
      await this.frameCommunicator.close();
    }
  }

  /**
   *
   * Close the Waymark UI and clean up any resources in use. Any in-progress videos will be
   * saved as drafts. Subsequently reopening the UI will be slower, so if you just want to
   * close the UI but retain the ability to quickly show it again, use {@link Waymark#close|Waymark.close}.
   *
   * Any logged-in account will be logged out as well.
   *
   * @returns {Promise} A promise that resolves when the UI has closed and all resources have
   * been cleaned up.
   */
  async cleanup() {
    // Cleanup and preserve any in-progress resources.
    if (this.frameCommunicator) {
      if (this.authMode !== 'uncontrolled') {
        // If the auth mode is controlled, log the account out on cleanup
        await this.frameCommunicator.logoutAccount();
      }

      await this.frameCommunicator.cleanup();
      this.frameCommunicator = null;
    }

    if (this.iframe) {
      this.iframe.remove();
      this.iframe = null;
    }

    // Unregister all event listeners
    for (const listenerKey in this.listeners) {
      if (this.listeners.hasOwnProperty(listenerKey)) {
        const eventName = listenerKey as WaymarkEventName;
        const eventListeners = this.listeners[eventName as WaymarkEventName];

        if (eventListeners) {
          for (const [originalCallback, listenerCallback] of eventListeners.entries()) {
            document.removeEventListener(`waymark:${eventName}`, listenerCallback);
            eventListeners.delete(originalCallback);
          }
        }

        delete this.listeners[eventName as WaymarkEventName];
      }
    }
  }
}

export default Waymark;
