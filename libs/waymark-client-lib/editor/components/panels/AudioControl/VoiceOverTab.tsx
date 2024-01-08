// VENDOR
import { useState } from 'react';

import _ from 'lodash';

// APP
import { useAccountAudioAssetForUploadKey } from 'app/models/accountAudioAssets/hooks';

// SHARED
import { WaymarkButton } from 'shared/components/WaymarkButton';
import { RotatingLoader } from '@libs/shared-ui-components';
import {
  useIsConfiguratorSetup,
  useVideoTemplateConfigurator,
} from 'shared/web_video/providers/VideoTemplateConfiguratorProvider';

// STYLES
import * as styles from './VoiceOverTab.css';

// APP
import { MediaVoiceIcon } from 'app/icons/MediaIcons';
import VOSpeakerModal from 'app/components/VOSpeakerModal';

// EDITOR
import AudioFileUploadButton from 'editor/components/AudioFileUploadButton';
import { useEditorDispatch } from 'editor/providers/EditorStateProvider.js';
import { VideoEditingFieldTypes } from 'editor/constants/Editor';
import { useEditorFieldsOfType } from 'editor/providers/EditorFormDescriptionProvider.js';
import {
  editorAudioConfigurationPaths,
  waymarkAPSPluginType,
} from 'editor/constants/EditorAudio.js';
import { useAudioControlsContext } from 'editor/providers/EditorAudioControlsProvider.js';
import { ScriptLengthQuality } from 'editor/constants/automatedVoiceOver';

// LOCAL
import VOScriptWritingTips from './VOScriptWritingTips';
import {
  useTTSSpeakers,
  useSelectedSpeaker,
  useScriptLengthQuality,
  useVoiceOverScript,
  useGenerateVoiceOver,
  useIsVoiceOverUpToDate,
  useShouldShowVoiceOverUpToDateWarning,
} from './state/textToSpeechStore';
import SelectedAudioAssetPreview from './SelectedAudioAssetPreview';
import VoiceOverScriptEditor from './VoiceOverScriptEditor';
import { InfoBox } from '@libs/shared-ui-components';

/**
 * The contents of the automated voice over panel which lets user generate
 * AI voice over and edit the corresponding script
 */
export default function VoiceOverTab() {
  // Editor dispatch functions save the user's VO selections to the UserVideo record in the DB
  const { setAppliedAIVoiceOverSpeakerGUID, setAppliedAIVoiceOverText } = useEditorDispatch();

  const audioField = useEditorFieldsOfType(VideoEditingFieldTypes.audio);
  const { useCurrentConfigurationValue, useUpdateConfigurationValue } = audioField;
  const currentConfigurationValue = useCurrentConfigurationValue(
    editorAudioConfigurationPaths.auxiliaryAudio,
  );
  const auxiliaryAudioConfigurationValue = useCurrentConfigurationValue(
    editorAudioConfigurationPaths.auxiliaryAudio,
  );
  const { accountAudioAsset: selectedAudioAsset, isLoading: isLoadingAsset } =
    useAccountAudioAssetForUploadKey(
      auxiliaryAudioConfigurationValue?.content?.location?.sourceAudio ?? null,
    );
  const hasSelectedAudioAsset = Boolean(selectedAudioAsset);

  let assetDisplayKey: 'hasAsset' | 'loadingAsset' | 'noAsset';
  if (hasSelectedAudioAsset) {
    assetDisplayKey = 'hasAsset';
  } else if (isLoadingAsset) {
    assetDisplayKey = 'loadingAsset';
  } else {
    assetDisplayKey = 'noAsset';
  }

  const updateConfigurationValue = useUpdateConfigurationValue();
  const { masterVolumeChanges } = useAudioControlsContext();

  const { isLoadingSpeakers } = useTTSSpeakers();
  const { selectedSpeaker, setSelectedSpeakerGUID } = useSelectedSpeaker();
  const { scriptText, setScriptText } = useVoiceOverScript();
  const scriptLengthQuality = useScriptLengthQuality();
  const { generateVoiceOver, isGeneratingVO, voGenerationErrorMessage } = useGenerateVoiceOver();

  const configurator = useVideoTemplateConfigurator();
  const isConfiguratorSetup = useIsConfiguratorSetup();

  const isConfiguratorAvailable = configurator && isConfiguratorSetup;

  const [isUploadingVO, setIsUploadingVO] = useState(false);

  const isVoiceOverUpToDate = useIsVoiceOverUpToDate();

  const doesScriptExceedCharacterLimit =
    scriptLengthQuality === ScriptLengthQuality.ExceedsCharacterLimit;

  const isFormSubmissionDisabled =
    !scriptText || !selectedSpeaker || doesScriptExceedCharacterLimit || isUploadingVO;

  // Gets TTS audio data, processes it, and applies it to the config
  const onSubmitTextToSpeech: React.FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();

    if (isFormSubmissionDisabled) {
      return;
    }

    let duration: number | undefined = undefined;

    if (isConfiguratorAvailable) {
      duration = Math.round(configurator.renderer.duration / configurator.renderer.framerate);
    }

    const audioSourceKey = await generateVoiceOver(duration);

    // If the audio source key is null, then there was an error generating the VO track
    if (!audioSourceKey) {
      return;
    }

    // Update the editor state to reflect the script/speaker of the newly generated VO track which
    // has now been applied to the video
    setAppliedAIVoiceOverText(scriptText);
    setAppliedAIVoiceOverSpeakerGUID(selectedSpeaker.id);

    // Apply the newly generated VO track to the video's configuration
    updateConfigurationValue(
      {
        content: {
          type: 'audio',
          location: {
            plugin: waymarkAPSPluginType,
            sourceAudio: audioSourceKey,
          },
        },
        isMuted: _.get(currentConfigurationValue, 'isMuted', false),
        volume: _.get(currentConfigurationValue, 'volume', 1),
        volumeChanges: _.get(currentConfigurationValue, 'volumeChanges', masterVolumeChanges),
      },
      editorAudioConfigurationPaths.auxiliaryAudio,
    );
  };

  const [isSpeakerModalOpen, setIsSpeakerModalOpen] = useState(false);

  const { shouldShowVoiceOverUpToDateWarning, dismissVOUpToDateWarning } =
    useShouldShowVoiceOverUpToDateWarning();

  return (
    <>
      <div className={styles.VOPreview}>
        {assetDisplayKey === 'hasAsset' && selectedAudioAsset ? (
          <SelectedAudioAssetPreview selectedAudioAsset={selectedAudioAsset} />
        ) : null}
        {assetDisplayKey === 'loadingAsset' ? (
          <RotatingLoader className={styles.VOPreviewLoader} />
        ) : null}
      </div>
      <VOScriptWritingTips className={styles.VOScriptTips} />
      <div
        {...styles.dataSpeakersLoading(isLoadingSpeakers || isUploadingVO || isGeneratingVO)}
        className={styles.VOFormContainer}
      >
        <RotatingLoader className={styles.SpeakersLoader} />
        <form className={styles.VOForm} onSubmit={onSubmitTextToSpeech}>
          <div>
            <div className={styles.SelectedSpeakerContainer}>
              <p>{selectedSpeaker?.name ?? 'No AI voice selected'}</p>
              <WaymarkButton
                className={styles.ChangeSpeakerButton}
                colorTheme="Secondary"
                isSmall
                isUppercase
                onClick={() => setIsSpeakerModalOpen(true)}
              >
                <MediaVoiceIcon width="16px" height="16px" />
                Change
              </WaymarkButton>
            </div>
          </div>

          <VoiceOverScriptEditor
            scriptText={scriptText}
            setScriptText={(text) => setScriptText(text)}
            selectedSpeaker={selectedSpeaker || null}
            scriptLengthQuality={scriptLengthQuality}
          />

          {voGenerationErrorMessage ? (
            <p className={styles.VOGenerationErrorMessage}>{voGenerationErrorMessage}</p>
          ) : null}

          {shouldShowVoiceOverUpToDateWarning && !isFormSubmissionDisabled && (
            <InfoBox
              colorTheme="Warning"
              onClose={() => dismissVOUpToDateWarning()}
              arrowDirection="bottom"
            >
              You have made changes since the last generation. Please generate the voice-over again
              once edits are complete.
            </InfoBox>
          )}

          <WaymarkButton
            isLoading={isGeneratingVO}
            className={styles.VOGenerateButton}
            colorTheme="Primary"
            type="submit"
            isUppercase
            isDisabled={isFormSubmissionDisabled || isVoiceOverUpToDate}
          >
            Generate
          </WaymarkButton>
        </form>
      </div>
      <AudioFileUploadButton
        onUploadStart={() => setIsUploadingVO(true)}
        onUploadComplete={() => setIsUploadingVO(false)}
        isDisabled={isGeneratingVO}
        className={styles.VOUploadButton}
      >
        Upload
      </AudioFileUploadButton>
      <VOSpeakerModal
        cancelInterface="x"
        modalSize="445px"
        isVisible={isSpeakerModalOpen}
        initialSelectedSpeakerID={selectedSpeaker?.id}
        onCloseModal={() => setIsSpeakerModalOpen(false)}
        onSelectSpeaker={(speakerId) => setSelectedSpeakerGUID(speakerId)}
      />
    </>
  );
}
