// Vendor
import _ from 'lodash';
import { useRef } from 'react';

// Editor
import { VideoEditingFieldTypes } from 'editor/constants/Editor';
import { useEditorFieldsOfType } from 'editor/providers/EditorFormDescriptionProvider.js';
import EditorCollapsibleLibrarySection from 'editor/components/EditorCollapsibleLibrarySection.js';
import { EditorControlSectionHeading } from 'editor/components/EditorControlHeadings';
import { editorAudioConfigurationPaths } from 'editor/constants/EditorAudio.js';
import { useEditorMediaLibraries } from 'editor/providers/EditorMediaLibrariesProvider.js';
import AudioAssetPreview from 'editor/components/AudioAssetPreview/AudioAssetPreview';
import { TemplateAudioAsset } from 'editor/types/audioAsset';
import EditorVolumeSlider from 'editor/components/EditorVolumeSlider';
import { useAudioControlsContext } from 'editor/providers/EditorAudioControlsProvider';

// Shared
import { usePauseVideoPlayback } from 'shared/web_video/providers/VideoTemplateConfiguratorProvider';

// STYLES
import * as styles from './MusicTab.css';

// WAYMARK APP DEPENDENCIES
import { MediaMusicIcon } from 'app/icons/MediaIcons';

interface AudioAssetListItemProps {
  /**
   * Variant or global audio asset which can be previewed and selected as the video's background music
   */
  audioAsset: TemplateAudioAsset;
  /**
   * The current audio asset location key selected in the video's background music configuration value
   */
  currentConfigurationAudioLocationKey: string;
  /**
   * Selects an asset to be used as the video's background music
   */
  onClickSelectAsset: (audioAsset: TemplateAudioAsset) => void;
}
export const AudioAssetListItem = ({
  audioAsset,
  currentConfigurationAudioLocationKey,
  onClickSelectAsset,
}: AudioAssetListItemProps) => (
  <AudioAssetPreview
    audioAsset={audioAsset}
    isSelected={currentConfigurationAudioLocationKey === audioAsset.assetKey}
    onClickAudioAsset={() => onClickSelectAsset(audioAsset)}
    icon={<MediaMusicIcon color="currentColor" className={styles.MusicIcon} />}
    className={styles.MusicPreview}
  />
);

/**
 * The contents of the background music panel which allows the user to select a background music track
 */
export default function MusicTab() {
  const audioField = useEditorFieldsOfType(VideoEditingFieldTypes.audio);
  const { useCurrentConfigurationValue, useUpdateConfigurationValue } = audioField;

  const currentConfigurationValue = useCurrentConfigurationValue(
    editorAudioConfigurationPaths.backgroundAudio,
  );

  const currentConfigurationAudioLocationKey = currentConfigurationValue?.location?.key;

  const updateConfigurationValue = useUpdateConfigurationValue();

  const pauseVideoPlayback = usePauseVideoPlayback();

  const onClickSelectAsset = async (asset: TemplateAudioAsset) => {
    await pauseVideoPlayback();

    const waymarkAudioAsset = asset?.waymarkAudioAsset;
    if (waymarkAudioAsset) {
      updateConfigurationValue(
        asset.waymarkAudioAsset,
        editorAudioConfigurationPaths.backgroundAudio,
      );
    }
  };

  const {
    audio: { globalAudio, variantAudio },
  } = useEditorMediaLibraries();

  const hasGlobalAudio = !_.isEmpty(globalAudio);

  // Keep a ref for the slug of the global audio library which contains the currently selected audio asset,
  // if applicable; we'll use this info to make sure that library is expanded initially
  // so it's easier for the user to find the asset that's currently on the video
  const initiallySelectedAudioLibrarySlugRef = useRef<string | null>();
  if (hasGlobalAudio && initiallySelectedAudioLibrarySlugRef.current === undefined) {
    initiallySelectedAudioLibrarySlugRef.current =
      // @ts-expect-error TODO: needs types
      globalAudio.find(({ audio }) =>
        audio.find(
          // @ts-expect-error TODO: needs types
          ({ waymarkAudioAsset }) =>
            waymarkAudioAsset?.location?.key === currentConfigurationAudioLocationKey,
        ),
      )?.slug ?? null;
  }

  const {
    auxiliaryAudioLayer,
    updateAuxiliaryLayerVolume,
    isMainAudioVolumeControlEnabled,
    mainAudioVolumeSettings,
    updateMainLayerVolume,
  } = useAudioControlsContext();

  // If we don't have an auxiliary audio layer yet, disable the VO volume slider
  const areVoiceOverVolumeControlsDisabled = !auxiliaryAudioLayer;

  let voiceOverVolumeSliderValue = 0;

  if (!areVoiceOverVolumeControlsDisabled) {
    if (auxiliaryAudioLayer && !auxiliaryAudioLayer.isMuted) {
      voiceOverVolumeSliderValue = (auxiliaryAudioLayer.volume || 1) * 100;
    }
  }

  return (
    <>
      <div className={styles.VolumeSlidersContainer}>
        <EditorVolumeSlider
          currentVolume={voiceOverVolumeSliderValue}
          updateVolume={updateAuxiliaryLayerVolume}
          isDisabled={areVoiceOverVolumeControlsDisabled}
          sliderLabel={
            areVoiceOverVolumeControlsDisabled ? 'No voice-over selected' : 'Voice-over volume'
          }
        />
        {isMainAudioVolumeControlEnabled ? (
          <EditorVolumeSlider
            currentVolume={
              mainAudioVolumeSettings.isMuted ? 0 : mainAudioVolumeSettings.volume * 100 || 100
            }
            updateVolume={updateMainLayerVolume}
            sliderLabel="Music volume"
          />
        ) : null}
      </div>
      <EditorControlSectionHeading className={styles.MusicOptionsHeader} heading="Music Options" />
      {Boolean(variantAudio.length) && (
        <EditorControlSectionHeading
          heading="Recommended"
          headerTypography="bodyBold"
          headingClassName={styles.RecommendedMusicHeader}
        />
      )}

      {/* @ts-expect-error TODO: needs types */}
      {variantAudio.map((variantAudioAsset) => (
        <AudioAssetListItem
          key={variantAudioAsset.assetKey}
          audioAsset={variantAudioAsset}
          currentConfigurationAudioLocationKey={currentConfigurationAudioLocationKey}
          onClickSelectAsset={onClickSelectAsset}
        />
      ))}

      <div className={styles.MusicSection}>
        {/* @ts-expect-error TODO: needs types */}
        {globalAudio.map((globalAudioLibrary) => (
          <EditorCollapsibleLibrarySection
            key={globalAudioLibrary.slug}
            isInitiallyExpanded={
              globalAudioLibrary.slug === initiallySelectedAudioLibrarySlugRef.current
            }
            typography="bodyBold"
            primaryText={globalAudioLibrary.displayName}
            buttonClassName={styles.MusicSectionButton}
          >
            <div className={styles.MusicSectionContentsWrapper}>
              {/* @ts-expect-error TODO: needs types */}
              {globalAudioLibrary.audio.map((globalAudioAsset) => (
                <AudioAssetListItem
                  key={globalAudioAsset.assetKey}
                  audioAsset={globalAudioAsset}
                  currentConfigurationAudioLocationKey={currentConfigurationAudioLocationKey}
                  onClickSelectAsset={onClickSelectAsset}
                />
              ))}
            </div>
          </EditorCollapsibleLibrarySection>
        ))}
      </div>
    </>
  );
}
