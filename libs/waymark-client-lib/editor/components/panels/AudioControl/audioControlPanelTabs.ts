import makeEditorControlPanelTabs from 'editor/components/EditorControlPanelTabFactory';

import VoiceOverTab from './VoiceOverTab';
import MusicTab from './MusicTab';

export enum AudioControlTabNames {
  voiceOver = 'Voice-Over',
  music = 'Music',
}

const AUDIO_CONTROL_TAB_MODES = [
  {
    name: AudioControlTabNames.voiceOver,
    component: VoiceOverTab,
  },
  {
    name: AudioControlTabNames.music,
    component: MusicTab,
  },
];

export const { EditorPanelTabButtons, useCurrentTab, useSetCurrentTab } =
  makeEditorControlPanelTabs(AUDIO_CONTROL_TAB_MODES);
