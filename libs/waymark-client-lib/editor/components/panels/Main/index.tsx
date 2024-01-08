// Editor
import makeEditorControlPanel from 'editor/components/panels/utils/makeEditorControlPanel';

// Panel
import MainPanelHeader from './PanelHeader';
import MainPanelControls from './PanelControls';

/**
 * Constructing and exporting an object that can be consumed by the EditorControlPanel component to render the appropriate
 * components for this editor control panel
 *
 * The output format is an object with the structure:
 * {
 *   Header: HeaderComponent,
 *   Controls: ControlsComponent,
 *   Provider: ProviderComponent (optional)
 * }
 */
export default makeEditorControlPanel(MainPanelHeader, MainPanelControls);
