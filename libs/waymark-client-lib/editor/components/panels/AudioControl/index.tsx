// Editor
import makeEditorControlPanel from '../utils/makeEditorControlPanel';

// Panel
import AutomatedVoiceOverPanelControls from './PanelControls';
import AutomatedVoiceOverPanelHeader from './PanelHeader';

export default makeEditorControlPanel(
  AutomatedVoiceOverPanelHeader,
  AutomatedVoiceOverPanelControls,
);
