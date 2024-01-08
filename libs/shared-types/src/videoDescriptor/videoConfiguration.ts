export type LayoutSelectorFieldConfigurationValue = string;

export type ShapeConfigurationValue = {
  fillColor: string;
  strokeColor: string;
};

export type WaymarkLocation = {
  plugin: 'waymark';
  type: string;
  key: string;
};

export type LegacyTimecode = {
  nativeVideoWidth: number;
  nativeVideoHeight: number;
};

export type WaymarkVPSLocation = {
  plugin: 'waymark-vps';
  sourceVideo: string;
  // TODO: As the name suggests, this property is only needed as a temporary workaround for
  // the renderer, so eventually we will be able to safely remove this. As of this time there
  // are still nearly 600 video template variants with `legacyTimecode` in their configurations.
  legacyTimecode?: LegacyTimecode | null;
};

export type AudioFieldConfigurationValue = {
  location: WaymarkLocation;
  type: 'audio';
};

export type WaymarkAudioConfigurationValue = {
  volumeChanges: string[];
};

export type AuxiliaryAudioLocation = {
  plugin: 'waymark-aps';
  sourceAudio: string;
};

export type AuxiliaryAudio =
  | {
      volume: number;
      content: {
        location: AuxiliaryAudioLocation;
        type: 'audio';
      };
      isMuted: boolean;
    }
  | WaymarkAudioConfigurationValue;

export type TextTypographyConfiguration = {
  fontFamily: string;
  fontSizeAdjustment: number;
  fontStyle: string;
  fontWeight: number;
};

export type BFSTypographyConfiguration = {
  fontFamily: string;
  fontSizeAdjustment: number;
  fontVariantUUID: string;
};

export type TextFieldConfigurationValue = {
  // yes, content is optional. In the studio, a text element can be created such that its typography
  // can be edited and its actual (non-existent) text cannot. ¯\_(ツ)_/¯
  content?: string;
  fillColor?: string;
  typography?: BFSTypographyConfiguration;
};

export type ImageOverrideConfigurationValue = {
  type: 'image';
  w?: number | null;
  h?: number | null;
  id?: string;
  location: WaymarkLocation;
  modifications?: {
    adjustments?: {
      blur?: number;
      brightness?: number;
      contrast?: number;
      duotone?: [string, string];
      duotoneAlpha?: number;
      exposure?: number;
      highlight?: number;
      monochrome?: string;
      noiseReduction?: number;
      noiseReductionSharpen?: number;
      saturation?: number;
      shadow?: number;
      sharpen?: number;
      unsharpMask?: number;
      vibrance?: number;
    };
    backgroundFill?: string;
    cropping?: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    fillColor?: string;
    fit?: string;
    padding?: number;
    zoom?: {
      x: number;
      y: number;
      z: number;
    };
  } | null;
  name?: string;
};

export type ImageFieldConfigurationValue = {
  content: ImageOverrideConfigurationValue;
};

export type VideoFieldContent = {
  type: 'video';
  location: WaymarkVPSLocation;
};

export type VideoFieldContentCropping = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type VideoFieldContentZoom = {
  x: number;
  y: number;
  z: number;
};

export enum VideoFieldContentFit {
  Crop = 'crop',
  Fill = 'fill',
}

export type VideoFieldConfigurationValue = {
  layer?: string;
  isMuted?: boolean;
  volume: number;
  content: VideoFieldContent;
  contentTrimStartTime?: number;
  contentTrimDuration?: number;
  contentPlaybackDuration?: number;
  contentBackgroundFill?: string;
  contentCropping?: VideoFieldContentCropping;
  contentPadding?: number;
  contentFit?: VideoFieldContentFit;
  contentZoom?: VideoFieldContentZoom;
};

export type ColorOverrideConfigurationValue = string;

// Original configuration values in the editing form follow the old (pre-BFS) TextTypographyConfiguration structure
// but should be converted to the modern BFSTypographyConfiguration structure for output.
export type FontOverrideConfigurationValue =
  | BFSTypographyConfiguration
  | TextTypographyConfiguration;

export type FieldConfigurationValue =
  | LayoutSelectorFieldConfigurationValue
  | ShapeConfigurationValue
  | ColorOverrideConfigurationValue
  | FontOverrideConfigurationValue
  | ImageOverrideConfigurationValue
  | AudioFieldConfigurationValue
  | TextFieldConfigurationValue
  | ImageFieldConfigurationValue
  | VideoFieldConfigurationValue
  | WaymarkAudioConfigurationValue
  | AuxiliaryAudio;

export interface VideoConfiguration {
  [key: string]: FieldConfigurationValue;
}
