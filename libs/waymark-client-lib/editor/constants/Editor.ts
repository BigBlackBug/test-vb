// Keys for all currently supported control panels that the editor can switch between
export const editorPanelKeys = {
  // Main initial panel
  main: 'main',
  // Audio
  audio: 'audio',
  // Color
  color: 'color',
  // Font
  font: 'font',
  // Image
  image: 'image',
  restoreRemovedImages: 'restore_removed_images',
  stockImageSearch: 'stock_image_search',
  // Video
  video: 'video',
  restoreRemovedVideos: 'restore_removed_videos',
  stockVideoSearch: 'stock_video_search',
} as const;
export type EditorPanelKey = (typeof editorPanelKeys)[keyof typeof editorPanelKeys];

export const waymarkAuthorPreviewSlug = 'author_preview';

export const defaultAudioCloudfrontURI = 'https://d1ckp10gqd0c6o.cloudfront.net/';

// All existing field types that the editor can render
export const VideoEditingFieldTypes = {
  audio: 'audio',
  color: 'color',
  font: 'font',
  image: 'image',
  video: 'video',
  layoutSelector: 'layout_selector',
  text: 'text',
  textSelector: 'text_selector',
  main: 'main',
} as const;

export const WAYMARK_AUTHOR_PREVIEW_SLUG = 'author_preview';

export const scrollableControlsWrapperID = 'wm-controls-wrapper';
