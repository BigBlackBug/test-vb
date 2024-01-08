// Vendor
import _ from 'lodash';
import { useSelector } from 'react-redux';

// Editor
import { VideoEditingFieldTypes, editorPanelKeys } from 'editor/constants/Editor';
import EditorVideoTitle from 'editor/components/EditorVideoTitle';
import BusinessProfileButton from 'editor/components/BusinessProfileButton';
import { useEditorFieldsOfType } from 'editor/providers/EditorFormDescriptionProvider.js';
import { useEditorVideoContext } from 'editor/providers/EditorVideoProvider.js';

// APP DEPENDENCIES
import * as selectors from 'app/state/selectors/index.js';
import { ColorPaletteIcon, FontIcon, MediaVoiceIcon } from 'app/icons/MediaIcons';

// Panel
import ControlPanelButton from './ControlPanelButton';
import MainFieldList from './fields/MainFieldList';
import { panelButtonGrid } from './PanelControls.css';

/**
 * Button to open the color panel
 */
const ColorPanelButton = () => (
  <ControlPanelButton panelKey={editorPanelKeys.color} icon={<ColorPaletteIcon />} text="Colors" />
);

/**
 * Button to open the font panel
 */
const FontPanelButton = () => (
  <ControlPanelButton panelKey={editorPanelKeys.font} icon={<FontIcon />} text="Font" />
);

/**
 * Button to open the background music panel
 */
const AudioControlPanelButton = () => (
  <ControlPanelButton panelKey={editorPanelKeys.audio} icon={<MediaVoiceIcon />} text="Audio" />
);

/**
 * Renders buttons to open other editor panels for the template, ie color, font, and audio panels
 */
const PanelButtons = () => {
  const colorFields = useEditorFieldsOfType(VideoEditingFieldTypes.color);
  const fontField = useEditorFieldsOfType(VideoEditingFieldTypes.font);
  const audioField = useEditorFieldsOfType(VideoEditingFieldTypes.audio);

  const panelButtons: React.ReactNode[] = [];

  if (!_.isEmpty(colorFields)) {
    panelButtons.push(<ColorPanelButton key="color" />);
  }

  if (fontField) {
    panelButtons.push(<FontPanelButton key="font" />);
  }

  if (audioField) {
    panelButtons.push(<AudioControlPanelButton key="audio" />);
  }

  return <div className={panelButtonGrid}>{panelButtons}</div>;
};

/**
 * Provides an interface for editing the video title, switching the editor to different modes,
 * and editing main fields in the video
 */
export default function MainPanelControls() {
  const { isEditableTemplate } = useEditorVideoContext();
  const hideAutoPersonalize = useSelector(
    selectors.getBrandingProfileShouldHideBusinessPersonalization,
  );

  return (
    <div data-testid="editorMainControlPanel">
      {/* Displays the current video title or displays a text input to edit the title
        when clicked */}
      <EditorVideoTitle />
      {!isEditableTemplate ? (
        'Editing no longer supported for this template.'
      ) : (
        <>
          {hideAutoPersonalize ? null : <BusinessProfileButton />}
          <PanelButtons />
          {/* Controls for main editor fields, ie text, layout selector, inline images */}
          <MainFieldList />
        </>
      )}
    </div>
  );
}
