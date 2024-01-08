import { EditorPanelKey, editorPanelKeys } from 'editor/constants/Editor';
import MainControlPanel from 'editor/components/panels/Main';
import EditorImageControlPanel from 'editor/components/EditorImageControlPanel.js';
import ImageRestorationControlPanel from 'editor/components/ImageRestorationControlPanel.js';
import VideoRestorationControlPanel from 'editor/components/VideoRestorationControlPanel.js';
import EditorVideoControlPanel from 'editor/components/EditorVideoControlPanel.js';
import EditorStockVideoSearchControlPanel from 'editor/components/EditorStockVideoSearchControlPanel.js';
import EditorColorControlPanel from 'editor/components/EditorColorControlPanel.js';
import AudioControlPanel from 'editor/components/panels/AudioControl';
import EditorFontControlPanel from 'editor/components/EditorFontControlPanel.js';
import { EditorControlPanelComponents } from 'editor/components/panels/utils/makeEditorControlPanel';
import StockImageSearchPanel from 'editor/components/panels/StockImageSearch';

/**
 * Object maps all control panel components to their corresponding panel and subpanel modes
 *
 * Note that each export from a control panel should be created using the makeEditorControlPanel util function
 * so it will have the following format that can be consumed by the EditorControlPanel component:
 * {
 *   Header: HeaderComponent,
 *   Controls: ControlsComponent,
 *   Provider: ProviderComponent (optional)
 * }
 */
const EditorControlPanels: {
  [key in EditorPanelKey]: EditorControlPanelComponents;
} = {
  // Main initial panel
  [editorPanelKeys.main]: MainControlPanel,
  // Audio panels
  [editorPanelKeys.audio]: AudioControlPanel,
  // Color panel
  [editorPanelKeys.color]: EditorColorControlPanel,
  // Font panel
  [editorPanelKeys.font]: EditorFontControlPanel,
  // Image panels
  [editorPanelKeys.image]: EditorImageControlPanel,
  [editorPanelKeys.restoreRemovedImages]: ImageRestorationControlPanel,
  // TODO: make this a real panel
  [editorPanelKeys.stockImageSearch]: StockImageSearchPanel,
  // Video panels
  [editorPanelKeys.video]: EditorVideoControlPanel,
  [editorPanelKeys.stockVideoSearch]: EditorStockVideoSearchControlPanel,
  [editorPanelKeys.restoreRemovedVideos]: VideoRestorationControlPanel,
};

export default EditorControlPanels;
