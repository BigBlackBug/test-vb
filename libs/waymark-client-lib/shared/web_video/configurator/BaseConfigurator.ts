/* eslint-disable @typescript-eslint/no-empty-function */
// Vendor
import EventEmitter from 'wolfy87-eventemitter';

import { VideoDescriptor, VideoConfiguration } from '@libs/shared-types';

export interface BaseConfiguratorOptions {
  renderingEnvironment?: (typeof BaseConfigurator.renderingEnvironment)[keyof typeof BaseConfigurator.renderingEnvironment];
}

/**
 * This is the interface to be implemented by a configurator.
 * It contains all of the necessary lifecycle and action methods
 * needed to power configurator-based applications.
 */
abstract class BaseConfigurator<
  TOptions extends BaseConfiguratorOptions = BaseConfiguratorOptions,
> {
  // TODO: It's very early for these, right now 'assetExport' is the only one in use (and who knows
  // they all could go away eventually). Tread lightly, think abstractly, and ask questions if you're
  // think about relying on or extending these "rendering environments".
  static renderingEnvironment = {
    assetExport: 'assetExport',
    browser: 'browser',
  } as const;

  static setupState = {
    initial: 'initial',
    inProgress: 'inProgress',
    success: 'success',
    failure: 'failure',
  } as const;

  eventEmitter: EventEmitter;

  canvasElement: HTMLCanvasElement | null = null;
  options: TOptions;

  // A null value for @configuration implies that the configuration has never been loaded before (see: hasLoadedConfiguration)
  configuration: VideoConfiguration | null = null;

  // Whether the video has been started for the first time
  hasVideoStartedPlaying = false;

  // Private/internal variables
  private internalIsLoadingConfiguration = false;
  private internalIsMounted = false;
  private internalIsMuted = false;
  private internalSetupState: (typeof BaseConfigurator.setupState)[keyof typeof BaseConfigurator.setupState] =
    BaseConfigurator.setupState.initial;

  isAttemptingToStop = false;
  isAttemptingToPlay = false;

  constructor(canvasElement: HTMLCanvasElement | null, options: TOptions) {
    this.eventEmitter = new EventEmitter();

    // Merge with default options
    this.isSafeToDisplay = this.isSafeToDisplay.bind(this);
    this.options = {
      renderingEnvironment: BaseConfigurator.renderingEnvironment.browser,
      ...options,
    };
    this.canvasElement = canvasElement || document.createElement('canvas');
  }

  /**
   * This is run to setup a configurator. Applications
   * will assumed this is an asynchornous process.
   */
  async setup(videoDescriptor: VideoDescriptor) {
    if (this.isSetup()) {
      console.warn('`setup()` is being called on a Configurator that is already setup');
    }

    if (this.isSetupInProgress()) {
      console.warn(
        '`setup()` is being called on a Configurator that is in the process of being setup',
      );
    }

    this.internalSetupState = BaseConfigurator.setupState.inProgress;

    try {
      await this.configuratorWillSetup(videoDescriptor);
      await this.configuratorDidSetup(videoDescriptor);

      this.internalSetupState = BaseConfigurator.setupState.success;

      // Load the configuration
      await this.loadConfiguration(videoDescriptor.__activeConfiguration);
      this.emit('setup');
    } catch (err) {
      console.error('An exception was thrown during Configurator setup:', err);
      this.internalSetupState = BaseConfigurator.setupState.failure;
    }
  }

  isSetupInProgress() {
    return this.internalSetupState === BaseConfigurator.setupState.inProgress;
  }

  isSetup() {
    return this.internalSetupState === BaseConfigurator.setupState.success;
  }

  /**
   * A check to determine if the configurator is currently loading a new configuration (either for the first time, or subsequent loads)
   * @method isLoadingConfiguration
   * @return {Boolean}
   */
  isLoadingConfiguration() {
    return this.internalIsLoadingConfiguration;
  }

  /**
   * A check to determine if a configuration has been supplied to the configurator.
   * @method hasLoadedConfiguration
   * @return {Boolean}
   */
  hasLoadedConfiguration() {
    return this.configuration !== null;
  }

  /**
   * A check to determine that a configurator has been setup, the initial configuration has been supplied and we're not currently loading a configuration
   * At this point, things like plugins, should also have been setup
   * @method isSafeToDisplay
   * @return {Boolean}
   */
  isSafeToDisplay() {
    return this.isSetup() && this.hasLoadedConfiguration() && !this.isLoadingConfiguration();
  }

  /**
   * Checks if the video has been played for the first time after loading - note that in the editor,
   * a field can jump the video to a time without playing it, so simply keeping track of that would be insufficient -
   * hasVideoBeenStarted will be true in those scenarios as well
   */
  hasVideoBeenStarted() {
    return this.hasVideoStartedPlaying;
  }

  /**
   * Updates hasVideoStartedPlaying to true to indicate that the user has begun playing the video for the first time
   */
  markVideoAsStarted() {
    this.hasVideoStartedPlaying = true;
  }

  /**
   * This is run when a configurator is being disposed. It should remove all
   * references to resources obtained during setup. Configurators must be
   * discarded after destruction as they can no longer be used.
   * @return {Promise} A Promise to destroy the configurator.
   */
  async destroy() {
    try {
      await this.configuratorWillDestroy();

      this.canvasElement = null;
      this.configuration = null;

      await this.configuratorDidDestroy();
    } catch (error) {
      console.error('An exception was thrown during Configurator destroy:', error);
    }
  }

  /**
   * Loads a given configuration. Applications will assume
   * this is an asynchronous process.
   */
  async loadConfiguration(configuration: VideoConfiguration) {
    // If we try to load the configuration when the configurator isn't setup, throw an error
    if (!this.isSetup()) {
      const errorMessage = 'Attempting to load configuration on a configurator that is not setup';
      console.error(errorMessage);
      throw errorMessage;
    }

    try {
      this.internalIsLoadingConfiguration = true;
      this.configuration = configuration;

      await this.configuratorWillLoadConfiguration(configuration);

      await this.configuratorDidLoadConfiguration(configuration);
    } catch (error) {
      console.error('An exception was thrown during Configurator loadConfiguration:', error);
    } finally {
      this.internalIsLoadingConfiguration = false;
    }
  }

  /**
   * Makes the renderer go to a given frame number
   */
  abstract performGoToFrame(frameNumber: number): Promise<void>;

  /**
   * These are dummy lifecycle methods to be overridden by child configurators if necessary.
   */

  /**
   * Lifecycle method called when the configurator is being setup.
   * Implementing configurators should perform any additional necessary setup tasks in here.
   */
  configuratorWillSetup(videoDescriptor: VideoDescriptor): void | Promise<void> {}
  /**
   * Lifecycle method called after configuratorWillSetup succeeded, meaning
   * the configurator has been setup succesfully.
   */
  configuratorDidSetup(videoDescriptor: VideoDescriptor): void | Promise<void> {}

  /**
   * Lifecycle method called when the configurator is about to start playing.
   */
  configuratorWillPlay(): void | Promise<void> {}
  /**
   * Lifecycle method called after the configurator has successfully started playing.
   */
  configuratorDidPlay(): void | Promise<void> {}
  /**
   * Lifecycle method called when the configurator is about to stop playing.
   */
  configuratorWillStop(): void | Promise<void> {}
  /**
   * Lifecycle method called after the configurator has successfully stopped playing.
   */
  configuratorDidStop(): void | Promise<void> {}
  /**
   * Lifecycle method called when the configurator is about to go to a given frame.
   */
  configuratorWillGoToFrame(frameNumber: number): void | Promise<void> {}
  /**
   * Lifecycle method called after the configurator has successfully gone to a given frame.
   */
  configuratorDidGoToFrame(frameNumber: number): void | Promise<void> {}

  /**
   * Lifecycle method called when the configurator is about to load a new configuration.
   */
  configuratorWillLoadConfiguration(configuration: VideoConfiguration): void | Promise<void> {}
  /**
   * Lifecycle method called after the configurator has successfully loaded a new configuration.
   */
  configuratorDidLoadConfiguration(configuration: VideoConfiguration): void | Promise<void> {}

  /**
   * Lifecycle method called when the configurator is about to be destroyed.
   */
  configuratorWillDestroy(): void | Promise<void> {}
  /**
   * Lifecycle method called after the configurator has been destroyed.
   */
  configuratorDidDestroy(): void | Promise<void> {}

  /**
   * Is the configurator currently mounted?
   */
  isMounted() {
    return this.internalIsMounted;
  }

  /**
   * Starts the configurator rendering to its canvas element. This is assumed to
   * be a syncronous hook -- does not support handling of returned promises from
   * the configuratorWillMount / configuratorDidMount interface.
   */
  mount() {
    if (!this.isSetup()) {
      console.warn('`mount()` is being called on a configurator that is not setup.');
    }

    this.configuratorWillMount();
    this.internalIsMounted = true;
    this.configuratorDidMount();
  }

  /**
   * Stops the configurator rendering to its canvas element. This is an asynchronous hook in that we
   * return a promise that waits for the configurator `stop` method to complete. However, this does
   * not support handling of returned promises from the configuratorWillUnmount / configuratorDidUnmount
   * interface.
   */
  async unmount() {
    if (!this.isSetup()) {
      console.warn('`unmount()` is being called on a configurator that is not setup.');
    }

    await this.configuratorWillUnmount();

    this.internalIsMounted = false;

    await this.stop();

    await this.configuratorDidUnmount();
  }

  /**
   * These are dummy lifecycle methods to be overridden by child configurators if necessary.
   */

  configuratorWillMount(): void | Promise<void> {}
  configuratorDidMount(): void | Promise<void> {}
  configuratorWillUnmount(): void | Promise<void> {}
  configuratorDidUnmount(): void | Promise<void> {}

  /**
   * Play starting at the current frame.
   * TODO: When this play catches on 'isLoadingConfiguration', 'isPlaying', 'isAttemptingToStop', or 'isAttemptingToPlay', we should probably also reject
   * this play attempt. It doesn't really make sense to resolve the promise when we're not actually playing. We need to consider reorgainzing the UI to respond to this
   */
  async play() {
    if (
      this.isLoadingConfiguration() ||
      this.isPlaying() ||
      this.isAttemptingToStop ||
      this.isAttemptingToPlay
    ) {
      // No-op
      return;
    }

    try {
      this.isAttemptingToPlay = true;
      await this.configuratorWillPlay();

      this.performPlay();

      await this.configuratorDidPlay();

      this.emit('play');
    } catch (error) {
      console.error('Something went wrong during `play`: ', error);
    } finally {
      this.isAttemptingToPlay = false;
      this.markVideoAsStarted();
    }
  }

  /**
   * The method that actually triggers a play of the configurator
   */
  abstract performPlay(): void | Promise<void>;

  /**
   * Is the movie playing?.
   */
  abstract isPlaying(): boolean;

  /**
   * Stop at the current frame.
   */
  async stop() {
    if (!this.isPlaying() || this.isAttemptingToPlay || this.isAttemptingToStop) {
      return;
    }

    try {
      this.isAttemptingToStop = true;
      await this.configuratorWillStop();
      this.performStop();
      await this.configuratorDidStop();
      this.emit('stop');
    } catch (error) {
      console.error('Something went wrong during `stop`: ', error);
    } finally {
      this.isAttemptingToStop = false;
    }
  }

  /**
   * The method that actually triggers a stop of the configurator
   */
  abstract performStop(): void | Promise<void>;

  /**
   * Mute the sound
   */
  mute() {
    this.internalIsMuted = true;
    return this.emit('mute');
  }

  /**
   * Unmute the sound
   */
  unmute() {
    this.internalIsMuted = false;
    return this.emit('unmute');
  }

  /**
   * Is the configurator muted?
   */
  isMuted() {
    return this.internalIsMuted;
  }

  /**
   * Seek to a given frame and stop.
   * @param  {number} frameNumber The frame to seek to.
   */
  async goToFrame(frameNumber: number) {
    await this.stop();

    await this.configuratorWillGoToFrame(frameNumber);

    await this.performGoToFrame(frameNumber);

    await this.configuratorDidGoToFrame(frameNumber);

    this.markVideoAsStarted();

    this.emit('goToFrame', frameNumber);
  }

  /**
   * Seek to a given time in seconds and stop.
   * @return {double} Framerate of the video
   */
  async goToTimeInSeconds(timeInSeconds: number) {
    const framerate = this.getFramerate();

    if (!framerate) {
      console.error("Can't go to time in seconds because configurator is not set up");
      return;
    }

    const framesPerSecond = 1 / framerate;
    const frame = Math.round(timeInSeconds * framesPerSecond);
    await this.goToFrame(frame);
  }

  /**
   * Get the total frames
   */
  abstract getTotalFrames(): number | null;

  /**
   * By default this is a calculated value. Returns the current time
   * (in seconds) of the video.
   * @return {double} Current time (in seconds).
   */
  getCurrentTime() {
    const frameRate = this.getFramerate();
    const currentFrame = this.getCurrentFrame();
    if (frameRate === null || currentFrame === null) {
      return null;
    }

    return frameRate * currentFrame;
  }

  /**
   * By default this is a calculated value. Returns the
   * total time of the video.
   * @return {double} Total time (in seconds).
   */
  getTotalTime() {
    const frameRate = this.getFramerate();
    const totalFrames = this.getTotalFrames();
    if (frameRate === null || totalFrames === null) {
      return null;
    }

    return frameRate * totalFrames;
  }

  /**
   * Returns the framerate of the video.
   * @return {double} Framerate of the video
   */
  abstract getFramerate(): number | null;

  /**
   * Returns the current frame of the video.
   * @return {integer} Current frame of video.
   */
  abstract getCurrentFrame(): number | null;

  PROVISIONAL_INTERFACE_getBounds() {
    return {
      width: this.canvasElement?.width ?? 0,
      height: this.canvasElement?.height ?? 0,
    };
  }

  emit(eventName: string, ...args: Array<unknown>) {
    this.eventEmitter.emit(eventName, ...args);
  }

  on(eventName: string, callback: (...args: Array<unknown>) => void) {
    this.eventEmitter.on(eventName, callback);
  }

  off(eventName: string, callback: (...args: Array<unknown>) => void) {
    this.eventEmitter.off(eventName, callback);
  }
}

export default BaseConfigurator;
