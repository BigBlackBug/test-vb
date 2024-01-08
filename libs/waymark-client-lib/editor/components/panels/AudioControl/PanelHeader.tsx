// Vendor
import { useCallback, useState } from 'react';

// Editor
import { useEditorFieldsOfType } from 'editor/providers/EditorFormDescriptionProvider';
import { VideoEditingFieldTypes } from 'editor/constants/Editor';
import EditorResetConfirmationModal from 'editor/components/EditorResetConfirmationModal';
import HeaderButtonRow from 'editor/components/EditorControlPanelHeaderButtonRow';
import BaseHeaderBackButton from 'editor/components/BaseHeaderBackButton';

// Shared
import { usePauseVideoPlayback } from 'shared/web_video/providers/VideoTemplateConfiguratorProvider';
import { WaymarkButton } from 'shared/components/WaymarkButton';

// Local
import { AudioControlTabNames, useCurrentTab } from './audioControlPanelTabs';

/**
 * Displays a back button to navigate away from the Automated Voice Over Panel
 */
export default function AudioControlPanelHeader() {
  const { name: currentTabName } = useCurrentTab();

  const pauseVideoPlayback = usePauseVideoPlayback();

  // Destructuring hook before using so that we can take advantage of eslint rules of hooks
  const { useResetAuxiliaryAudioToDefault } = useEditorFieldsOfType(VideoEditingFieldTypes.audio);
  const resetAuxiliaryAudioToDefault = useResetAuxiliaryAudioToDefault();

  const { useResetBackgroundAudioToDefault } = useEditorFieldsOfType(VideoEditingFieldTypes.audio);
  const resetBackgroundAudioToDefault = useResetBackgroundAudioToDefault();

  // Keep track of whether to show reset modal
  const [isResetting, setIsResetting] = useState(false);

  // Resets the template's VO track to the variant default
  const onClickResetVO = useCallback(async () => {
    await pauseVideoPlayback();
    resetAuxiliaryAudioToDefault();
  }, [pauseVideoPlayback, resetAuxiliaryAudioToDefault]);

  // Resets the template's selected audio track to the variant default
  const onClickResetMusic = useCallback(async () => {
    await pauseVideoPlayback();
    resetBackgroundAudioToDefault();
  }, [pauseVideoPlayback, resetBackgroundAudioToDefault]);

  return (
    <>
      <HeaderButtonRow>
        <BaseHeaderBackButton />
        {currentTabName === AudioControlTabNames.voiceOver ? (
          <>
            <WaymarkButton
              colorTheme="BlackText"
              onClick={() => setIsResetting(true)}
              hasFill={false}
              isSmall
            >
              Remove Voice-Over
            </WaymarkButton>
            <EditorResetConfirmationModal
              titleText="Remove Voice-Over"
              resetButtonText="Remove"
              bodyText="You will lose any changes you've made to this video's voice-over."
              isOpen={isResetting}
              onClose={() => setIsResetting(false)}
              onClickReset={onClickResetVO}
            />
          </>
        ) : (
          <>
            <WaymarkButton
              colorTheme="BlackText"
              onClick={() => setIsResetting(true)}
              hasFill={false}
              isSmall
            >
              Use Default
            </WaymarkButton>
            <EditorResetConfirmationModal
              bodyText="You will lose any changes you've made to this video's music."
              editingAttribute="Music"
              isOpen={isResetting}
              onClose={() => setIsResetting(false)}
              onClickReset={onClickResetMusic}
            />
          </>
        )}
      </HeaderButtonRow>
    </>
  );
}
