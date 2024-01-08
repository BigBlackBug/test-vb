// Vendor
import { useEffect, useMemo, useState } from 'react';

// Shared
import withWaymarkModal from 'shared/components/WithWaymarkModal';
import WaymarkModalHeading from 'shared/components/WaymarkModalHeading';
import { ExternalLink } from 'shared/components/WaymarkLinks';

// App
import { AIIcon } from 'app/icons/AIIcons';

// Editor
import EditorCollapsibleLibrarySection from 'editor/components/EditorCollapsibleLibrarySection';
import { useTTSSpeakers } from 'editor/components/panels/AudioControl/state/textToSpeechStore';
import AudioAssetPreview from 'editor/components/AudioAssetPreview/AudioAssetPreview';

// Local
import * as styles from './VOSpeakerModal.css';
import { VOSpeakerModalFilters } from './VOSpeakerModalFilters';

// Libs
import {
  AttributionIcon,
  AttributionIconCompanies,
  ModalHeaderSection,
  RotatingLoader,
} from '@libs/shared-ui-components/src';
import { SpeakerMap } from '@libs/tts-lib/src';

interface VOSpeakerModalProps {
  onCloseModal: () => void;
  onSelectSpeaker: (speakerID: string) => void;
  initialSelectedSpeakerID?: string;
}

function VOSpeakerModalContents({
  onSelectSpeaker,
  initialSelectedSpeakerID,
}: VOSpeakerModalProps) {
  const [selectedSpeakerID, setSelectedSpeakerID] = useState(initialSelectedSpeakerID || null);
  const [expandedSectionSpeakerGroupKey, setExpandedSectionSpeakerGroupKey] = useState<
    string | null
  >(null);
  const [speakerGroups, setspeakerGroups] = useState<Record<string, SpeakerMap> | null>(null);

  const { speakers } = useTTSSpeakers();

  // Precalculate the keys for all available speaker groups so that we can render them in the modal at all times, even if a given group is empty / filtered away.
  const speakerLanguageGroupKeys = useMemo(() => {
    if (!speakers) {
      return [];
    }

    const groupedSpeakers = speakers.groupByLanguage();
    return Object.keys(groupedSpeakers);
  }, [speakers]);

  useEffect(() => {
    // if we have a selected speaker, we want to expand the section that contains it by default
    if (!expandedSectionSpeakerGroupKey && selectedSpeakerID && speakerGroups) {
      for (const key in speakerGroups) {
        if (speakerGroups[key].has(selectedSpeakerID)) {
          setExpandedSectionSpeakerGroupKey(key);
        }
      }
    }
  }, [selectedSpeakerID, speakerGroups, expandedSectionSpeakerGroupKey]);

  const PLAYHT_LINK = 'http://help.waymark.com/en/articles/8102816-ai-voices-provided-by-playht';
  const WELLSAID_LINK =
    'http://help.waymark.com/en/articles/6830867-wellsaid-labs-ai-scriptwriting-and-pronunciation';

  return (
    <div>
      <ModalHeaderSection>
        <WaymarkModalHeading
          title="AI Voice"
          className={styles.VOSpeakerModalTitle}
          subTextClassName={styles.VOSpeakerModalSubtitle}
          subText={
            <>
              Voices powered by{' '}
              {
                <ExternalLink shouldOpenInNewTab linkTo={PLAYHT_LINK}>
                  PlayHT
                </ExternalLink>
              }{' '}
              &{' '}
              {
                <ExternalLink shouldOpenInNewTab linkTo={WELLSAID_LINK}>
                  WellSaid Labs
                </ExternalLink>
              }
            </>
          }
        />
      </ModalHeaderSection>

      {speakers && (
        <VOSpeakerModalFilters
          speakers={speakers}
          onFilterSpeakers={(filteredSpeakers) => {
            setspeakerGroups(filteredSpeakers);
          }}
        />
      )}

      <div>
        {!speakerGroups ? (
          <RotatingLoader />
        ) : (
          <div className={styles.SpeakerSections}>
            {speakerLanguageGroupKeys.map((speakerGroupKey) => (
              <EditorCollapsibleLibrarySection
                key={speakerGroupKey}
                primaryText={speakerGroupKey}
                isExpanded={expandedSectionSpeakerGroupKey === speakerGroupKey}
                // Setting expandedSectionSpeakerGroupKey on toggle, so that any other sections that are expanded are collapsed (see above)
                onToggleSection={() => setExpandedSectionSpeakerGroupKey(speakerGroupKey)}
                secondaryText={`${
                  speakerGroups[speakerGroupKey] ? speakerGroups[speakerGroupKey].size : 0
                }`}
                buttonClassName={styles.SpeakerSection}
                secondaryTextClassName={styles.SpeakerSectionCount}
              >
                <ul className={styles.SpeakerList}>
                  {speakerGroups[speakerGroupKey] ? (
                    Array.from(speakerGroups[speakerGroupKey].values()).map((speaker) => (
                      <li key={speaker.id}>
                        <AudioAssetPreview
                          isSelected={selectedSpeakerID === speaker.id}
                          className={styles.Speaker}
                          onClickAudioAsset={() => {
                            setSelectedSpeakerID(speaker.id);
                            onSelectSpeaker?.(speaker.id);
                          }}
                          audioAsset={{
                            displayName: `${speaker.name} - ${speaker.timbre
                              .concat(speaker.providerStyles)
                              .join(', ')} - ${speaker.paceDescription}`,
                            previewURL: speaker.previewURL,
                            currentAssetLocation: null,
                            isDynamicAssetType: false,
                            assetKey: speaker.id,
                            waymarkAudioAsset: null,
                          }}
                          attributionIcon={
                            <AttributionIcon
                              company={speaker.providerName as AttributionIconCompanies}
                            />
                          }
                          icon={<AIIcon />}
                        />
                      </li>
                    ))
                  ) : (
                    <p className={styles.NoSpeakersLabel}>No speakers match your filters.</p>
                  )}
                </ul>
              </EditorCollapsibleLibrarySection>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const VOSpeakerModal = withWaymarkModal()(VOSpeakerModalContents);
export default VOSpeakerModal;
