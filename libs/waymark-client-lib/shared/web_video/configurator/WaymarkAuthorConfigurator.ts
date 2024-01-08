// Vendor
import _ from 'lodash';
import Ajv from 'ajv';
import isMobile from 'ismobilejs';

// Local
import WaymarkAuthorWebRenderer, {
  ImageAssetChangeOperation,
  LayerImageChangeOperation,
  WaymarkVideoAssetChangeOperation,
  LayerVideoChangeOperation,
} from 'shared/WaymarkAuthorWebRenderer.js';
import { parseQueryParams, addQueryParametersToURL } from 'shared/utils/urls.js';
import BaseConfigurator, {
  BaseConfiguratorOptions,
} from 'shared/web_video/configurator/BaseConfigurator';
import ConfigurationInterpreter from 'shared/web_video/configurator/ConfigurationInterpreter.js';
import { actionTypes } from 'app/constants/ConfigurationInterpreterSchema.js';
import { waymarkAudioLayerType } from 'shared/web_video/configurator/constants/waymarkAuthorLayers.js';
import {
  VideoConfiguration,
  VideoDescriptor,
  EditingActions,
  ProjectManifest,
  TemplateManifest,
  FieldConfigurationValue,
} from '@libs/shared-types';

import {
  assetExportSettings,
  desktopBrowserSettings,
  mobileBrowserSettings,
} from 'shared/web_video/configurator/constants/WaymarkAuthorConfiguratorRendererSettings.js';
import { replaceOrAdd } from 'shared/utils/collections.js';

interface WaymarkAuthorConfiguratorOptions extends BaseConfiguratorOptions {
  projectManifest: ProjectManifest;
  templateManifest: TemplateManifest;
  editingActions: EditingActions;
  configurationSchema: Record<string, unknown>;
  slug: string;
  masterAudioLayerUUID: string;
  rendererOptions?: {
    additionalPixiOptions?: Record<string, unknown>;
  };
}

class WaymarkAuthorConfigurator extends BaseConfigurator<WaymarkAuthorConfiguratorOptions> {
  /**
   * Resizes an image in the passed configuration to the specified scale.
   * Only works with Imgix urls.
   * Called recursively for sub objects
   */
  static resizeConfigurationImages<
    TConfiguration extends VideoConfiguration | FieldConfigurationValue,
  >(configuration: TConfiguration, scale: number): TConfiguration {
    const updatedConfiguration = _.cloneDeep(configuration);

    Object.entries(updatedConfiguration).forEach(([key, value]) => {
      // If the key is another object, call recursively to search for images
      if (value !== null && typeof value === 'object') {
        WaymarkAuthorConfigurator.resizeConfigurationImages(value, scale);
        // If we have an image url (imgix), we can edit the size
      } else if (value !== null && typeof value === 'string' && value.indexOf('imgix') >= 0) {
        const queryStrings: {
          w?: string;
          h?: string;
        } = parseQueryParams(value);
        // We can only edit the size if we know the width and height
        if (queryStrings.w !== undefined && queryStrings.h !== undefined) {
          const width = Number(queryStrings.w) * scale;
          const height = Number(queryStrings.h) * scale;

          (updatedConfiguration as any)[key] = addQueryParametersToURL(value, {
            w: width,
            h: height,
          });
        }
      }
    });

    return updatedConfiguration;
  }

  renderer: WaymarkAuthorWebRenderer;

  configurationInterpreter: ConfigurationInterpreter | null = null;

  projectManifest: ProjectManifest;
  templateManifest: TemplateManifest;

  editingActions: EditingActions;
  configurationSchema: Record<string, unknown>;
  masterAudioLayerUUID: string;

  constructor(canvasElement: HTMLCanvasElement, options: WaymarkAuthorConfiguratorOptions) {
    super(canvasElement, options);

    let runtimeSettings:
      | typeof assetExportSettings
      | typeof desktopBrowserSettings
      | typeof mobileBrowserSettings;
    // `this.options` will contain the default `renderingEnvironment` if
    // `options.renderingEnvironment` is unset.
    if (this.options.renderingEnvironment === 'assetExport') {
      runtimeSettings = assetExportSettings;
    } else {
      runtimeSettings = isMobile().any ? mobileBrowserSettings : desktopBrowserSettings;
    }

    Object.assign(
      // Doing this weird any cast because TS freaks out that `settings` is not on `typeof WaymarkAuthorWebRenderer` for some reason
      (WaymarkAuthorWebRenderer as any).settings,
      runtimeSettings,
    );

    this.renderer = new WaymarkAuthorWebRenderer({
      // TODO: This should ultimately be a temporary fix. It is necessary because currently the template manifests from our
      // Waymark Author exports only have local asset paths - in the future, template manifests should be able to
      // be exported with the right asset paths
      assetPath: `https://socialproof-prod-s3-assets.imgix.net/web/video_creatives/${options.slug}/`,
      ...options.rendererOptions,
    });
    if (!options.projectManifest) {
      throw new Error('Must pass in `projectManifest` option to use WaymarkAuthorConfigurator.');
    }
    this.projectManifest = options.projectManifest;
    this.templateManifest = options.templateManifest;

    this.editingActions = options.editingActions;
    this.configurationSchema = options.configurationSchema;
    this.masterAudioLayerUUID = options.masterAudioLayerUUID;

    this.on('mute', () => {
      this.renderer.mute();
    });
    this.on('unmute', () => {
      this.renderer.unmute();
    });
  }

  async configuratorWillSetup(videoDescriptor: VideoDescriptor) {
    if (this.configurationSchema) {
      const ajv = new Ajv({ allErrors: true });
      const validator = ajv.compile(this.configurationSchema);
      // Validate the active configuration
      const isValid = validator(videoDescriptor.__activeConfiguration);

      // If our current configuration does not match up against the configuration schema,
      // log the errors for easier debugging.
      if (!isValid) {
        console.error('Invalid variant configuration:\n', ajv.errorsText(validator.errors));
      }
    } else {
      console.error(
        "No configuration schema provided to the Configurator -- unable to validate configuration. This is expected when previewing a template in the Waymark Template Studio, but nowhere else. If you are not previewing a template in the Waymark Template Studio, please call the authorities. Better yet, ensure there is a valid configuration schema in this template's bundle.",
      );
    }

    if (videoDescriptor.projectManifest) {
      this.projectManifest = _.cloneDeep(videoDescriptor.projectManifest);
    }
    if (videoDescriptor.templateManifest) {
      this.templateManifest = _.cloneDeep(videoDescriptor.templateManifest);
    }

    /**
     * START BUNDLE MODIFICATIONS
     * Note: We are making runtime modifications to bundles to ensure that the editor and renderer are
     * working with Ideal Template Bundles™, but eventually this code should move to the renderer.
     */
    // NOTE: We want to move away from the 'IMAGE_ASSET' and 'WAYMARK_VIDEO_ASSET' change operation types and to the
    // 'LAYER_IMAGE' and 'LAYER_VIDEO' types, respectively. Also, inside our cached editing actions we need to remove
    // the 'content' portion of the path, that way we are editing the entire layer object with configuration changes.
    const imageActionRegex = /image-.*\.content/;
    const videoActionRegex = /waymarkVideo-.*\.content/;
    this.editingActions.events.forEach((actionEvent) => {
      // Remove `.content` from editing action targets
      if (imageActionRegex.test(actionEvent.path)) {
        // eslint-disable-next-line no-param-reassign
        actionEvent.path = actionEvent.path.replace('.content', '');
      } else if (videoActionRegex.test(actionEvent.path)) {
        // eslint-disable-next-line no-param-reassign
        actionEvent.path = actionEvent.path.replace('.content', '');
      }

      // Replace `IMAGE_ASSET` action types with `LAYER_IMAGE` and
      // `WAYMARK_VIDEO_ASSET action types with `LAYER_VIDEO`
      if (_.isArray(actionEvent.actions)) {
        actionEvent.actions.forEach((action) => {
          if (action.type === ImageAssetChangeOperation.type) {
            // eslint-disable-next-line no-param-reassign
            action.type = LayerImageChangeOperation.type;
          } else if (action.type === WaymarkVideoAssetChangeOperation.type) {
            // eslint-disable-next-line no-param-reassign
            action.type = LayerVideoChangeOperation.type;
          }
        });
      }
    });

    // Ensure that the correct audio layer UUID is used throughout the bundle
    if (!this.masterAudioLayerUUID) {
      // eslint-disable-next-line no-console
      console.log(
        `%cNo background audio layer UUID found in template manifest`,
        'color: white; background-color: red; padding: 4px; border-radius:2px',
        this.projectManifest,
      );
    }

    // FIXME: we're just hitting the eject button and casting to any here because we don't have
    // good usable types for project manifest layers yet. We should udpate this once we have those types!
    const waymarkAuthorTempAudioLayers: Array<any> = this.projectManifest.layers.filter(
      (layer: any) => layer.nm === 'waymark_author_temp_audio_layer',
    );
    // Some template bundles, likely older templates, contain more than one 'waymark_author_temp_audio_layer',
    // and not all of them have the correct layer type (101). In order to properly control audio we need to
    // ensure:
    // - There is only one 'waymark_author_temp_audio_layer' per template
    // - The layer's meta UUID is the master audio layer UUID
    // - The layer has a type of 101
    if (
      !(
        waymarkAuthorTempAudioLayers.length === 1 &&
        waymarkAuthorTempAudioLayers[0].meta.uuid === this.masterAudioLayerUUID &&
        waymarkAuthorTempAudioLayers[0].ty === waymarkAudioLayerType
      )
    ) {
      // Remove the audio layers from the template manifest
      this.projectManifest.layers = this.projectManifest.layers.filter(
        (layer) => !waymarkAuthorTempAudioLayers.includes(layer),
      );

      // Find a layer with the correct type, set the UUID, and re-add it to the template manifest
      // If more than one layer has the correct type we can just use the first one we find
      const audioLayer = waymarkAuthorTempAudioLayers.find(
        (layer) => layer.ty === waymarkAudioLayerType,
      );
      audioLayer.meta.uuid = this.masterAudioLayerUUID;
      this.projectManifest.layers.push(audioLayer);
    }

    // Every template should have two audio editing actions for background audio:
    // - A `WAYMARK_AUDIO_ASSET` action to manage the audio asset
    // - A `LAYER_AUDIO` action to manage the volume settings
    // Both actions should have the same target, the master audio layer UUID
    const waymarkAudioAssetEditingAction = this.editingActions.events.find(
      (event) => _.get(event, 'actions[0].type') === actionTypes.waymarkAudioAsset,
    );
    // Published template bundles should always have a `WAYMARK_AUDIO_ASSET` editing action, but it's
    // possible that they don't. This could be for one of three reasons:
    // - The template is still in the QA process and audio has not been configured yet
    // - Audio is not configurable on this template
    // - Publisher forgot to add audio
    if (
      waymarkAudioAssetEditingAction &&
      // @ts-expect-error - the types here aren't good enough to be worth fighting with
      waymarkAudioAssetEditingAction.actions[0].targets[0] !== this.masterAudioLayerUUID
    ) {
      // @ts-expect-error - the types here aren't good enough to be worth fighting with
      waymarkAudioAssetEditingAction.actions[0].targets[0] = this.masterAudioLayerUUID;
      this.editingActions.events = replaceOrAdd(
        this.editingActions.events,
        waymarkAudioAssetEditingAction,
        'path',
      );
    }

    // If we don't have a `WAYMARK_AUDIO_ASSET` editing action there is no need to add the `LAYER_AUDIO` action
    if (waymarkAudioAssetEditingAction) {
      // Look for an existing `LAYER_AUDIO` editing action
      // Templates with video clips should already have one since we needed to support audio ducking for
      // video clips, but non-video-upload templates did not previously have the need for a `LAYER_AUDIO`
      // editing action.
      const layerAudioEditingAction = this.editingActions.events.find(
        (event) => _.get(event, 'actions[0].type') === actionTypes.audioLayerProperties,
      );

      // If the editing action already exists, make sure that it has the correct target
      if (layerAudioEditingAction) {
        // @ts-expect-error - the types here aren't good enough to be worth fighting with
        if (layerAudioEditingAction.actions[0].targets[0] !== this.masterAudioLayerUUID) {
          // @ts-expect-error - the types here aren't good enough to be worth fighting with
          layerAudioEditingAction.actions[0].targets[0] = this.masterAudioLayerUUID;
          this.editingActions.events = replaceOrAdd(
            this.editingActions.events,
            layerAudioEditingAction,
            'path',
          );
        }
      } else {
        // Add the editing action if it didn't already exist
        this.editingActions.events.push({
          path: `waymarkAudio--${this.masterAudioLayerUUID}`,
          actions: [
            {
              type: actionTypes.audioLayerProperties,
              targets: [this.masterAudioLayerUUID],
              value: {
                operation: 'passthrough',
              },
            },
          ],
        });
      }
    }
    /**
     * END BUNDLE MODIFICATIONS
     */

    this.configurationInterpreter = new ConfigurationInterpreter(
      this.renderer,
      this.editingActions,
      this.projectManifest,
    );

    // Get the renderer changes list for the initial configuration.
    // The template manifest is not required to match the initial configuration, so supplying this
    // changes list now instead of relying on the later configuratorDidLoadConfiguration call allows
    // the renderer to skip redundant assets that are replaced in the manifest by the initial
    // configuration.
    const changesList = await this.configurationInterpreter.getConfigurationChangeList(
      videoDescriptor.__activeConfiguration,
    );

    try {
      if (!this.canvasElement) {
        throw new Error('canvasElement is null');
      }

      await this.renderer._setup({
        changesList,
        videoData: this.projectManifest,
        view: this.canvasElement,
      });
    } catch (error) {
      console.error('There was an error setting up the renderer.', error);
    }

    // ConfigurationInterpreter sucks. We may want to either eliminate this method
    // or change its name (until we replace it altogether).
    this.configurationInterpreter.loadVideoConfiguration(videoDescriptor.__activeConfiguration);

    if (this.options.renderingEnvironment !== 'assetExport') {
      /* Resize the renderer to .7 scale for efficiency. Why .7? It was
      found to be the lowest scale at which all text was still legible in
      our inagural 4 Pixi templates. */
      this.renderer.setScale(0.7);
    }

    this.renderer.on('frameRender:end', this.onUpdateTimeline.bind(this));
  }

  async configuratorDidLoadConfiguration(configuration: VideoConfiguration) {
    if (!this.configurationInterpreter) {
      console.error('No configuration interpreter found. This should never happen.');
      return;
    }

    let updatedConfiguration = configuration;

    // Don't resize images when exporting
    if (this.options.renderingEnvironment !== 'assetExport') {
      // Resize images to half their size
      // TODO: Our original implementation resized images on mobile to 1/3 of their original
      // size, but images were weirdly zoomed that had uncommon aspect ratios. This is likely
      // due to a WebGL issue around resizing textures, and is roughly outlined in this JIRA:
      // https://stikdev.atlassian.net/browse/WILLOW-236.
      updatedConfiguration = WaymarkAuthorConfigurator.resizeConfigurationImages(
        updatedConfiguration,
        1 / 2,
      );
    }
    return this.configurationInterpreter.handleConfigurationChange(updatedConfiguration);
  }

  onUpdateTimeline() {
    this.emit('tick');
  }

  isPlaying() {
    if (!this.isSetup()) {
      return false;
    }

    return this.renderer.isPlaying;
  }

  performPlay() {
    this.renderer._play();
  }

  performStop() {
    this.renderer._stop();
  }

  getFramerate() {
    if (!this.isSetup()) {
      return null;
    }

    // TODO: Use a dynamic renderer fps, which is set to 30 in the renderer.
    return 1 / 30;
  }

  getTotalFrames() {
    if (!this.isSetup()) {
      return null;
    }

    return this.renderer.duration;
  }

  getCurrentFrame() {
    if (!this.isSetup()) {
      return null;
    }

    return this.renderer.currentTime;
  }

  isCompleted() {
    if (!this.renderer.rootTimeline) {
      return false;
    }

    const currentFrameNumber = this.getCurrentFrame();
    const totalFrames = this.getTotalFrames();

    // If a template is still being setup the current and total frames will return null.
    if (currentFrameNumber === null || totalFrames === null) {
      return false;
    }

    return currentFrameNumber >= totalFrames;
  }

  async performGoToFrame(frameNumber: number) {
    await this.renderer.goToFrame(frameNumber);
    this.onUpdateTimeline();
  }
}

export default WaymarkAuthorConfigurator;
