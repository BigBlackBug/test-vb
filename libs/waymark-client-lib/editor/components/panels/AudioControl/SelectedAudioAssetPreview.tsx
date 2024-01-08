// Vendor
import AudioAssetPreview from 'editor/components/AudioAssetPreview/AudioAssetPreview';

// WAYMARK APP DEPENDENCIES
import { MediaVoiceIcon } from 'app/icons/MediaIcons';
import { AIIcon } from 'app/icons/AIIcons';
import { AccountAudioAsset, AudioSources } from 'app/models/accountAudioAssets/types';

// Styles
import * as styles from './SelectedAudioAssetPreview.css';

interface SelectedAudioAssetPreviewProps {
  selectedAudioAsset: AccountAudioAsset;
}
export default function SelectedAudioAssetPreview({
  selectedAudioAsset,
}: SelectedAudioAssetPreviewProps) {
  const isSelectedTrackAIGenerated = selectedAudioAsset.source === AudioSources.Generated;

  return (
    <AudioAssetPreview
      audioAsset={selectedAudioAsset}
      assetDuration={selectedAudioAsset.length}
      icon={
        isSelectedTrackAIGenerated ? (
          <AIIcon color="currentColor" />
        ) : (
          <MediaVoiceIcon color="currentColor" className={styles.VoiceIcon} />
        )
      }
    />
  );
}
