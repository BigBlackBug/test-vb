import { useEffect, useMemo, useState } from 'react';
import { WaymarkButton } from 'shared/components/WaymarkButton';
import { PaceDescription, SpeakerMap } from '@libs/tts-lib/src';
import * as styles from './VOSpeakerModalFilters.css';

interface VOSpeakerModalFiltersProps {
  onFilterSpeakers: (filteredSpeakers: Record<string, SpeakerMap>) => void;
  speakers: SpeakerMap;
}

enum SpeakerTimbreFilters {
  Feminine = 'Feminine',
  Masculine = 'Masculine',
}

export function VOSpeakerModalFilters({ onFilterSpeakers, speakers }: VOSpeakerModalFiltersProps) {
  const [appliedSpeakerTimbreFilters, setAppliedSpeakerTimbreFilters] = useState<string[]>([]);
  const [appliedSpeakerPaceFilters, setAppliedSpeakerPaceFilters] = useState<PaceDescription[]>([]);

  // Selecting a filter will add it to the list of applied filters, assuming it's not already there. In which case, it will be removed.
  const selectTimbreFilter = (filter: string) => {
    if (appliedSpeakerTimbreFilters.includes(filter)) {
      setAppliedSpeakerTimbreFilters(appliedSpeakerTimbreFilters.filter((f) => f !== filter));
    } else {
      setAppliedSpeakerTimbreFilters([...appliedSpeakerTimbreFilters, filter]);
    }
  };

  // Selecting a filter will add it to the list of applied filters, assuming it's not already there. In which case, it will be removed.
  const selectPaceFilter = (filter: PaceDescription) => {
    if (appliedSpeakerPaceFilters.includes(filter)) {
      setAppliedSpeakerPaceFilters(appliedSpeakerPaceFilters.filter((f) => f !== filter));
    } else {
      setAppliedSpeakerPaceFilters([...appliedSpeakerPaceFilters, filter]);
    }
  };

  // speakerGroups is a map of language codes to SpeakerMaps. Each SpeakerMap contains speakers that match the applied filters.
  const speakerGroups = useMemo(() => {
    return speakers
      .multiFilter({
        timbre: appliedSpeakerTimbreFilters.length > 0 ? appliedSpeakerTimbreFilters : null,
        language: null,
        pace: appliedSpeakerPaceFilters.length > 0 ? appliedSpeakerPaceFilters : null,
      })
      .groupByLanguage();
  }, [speakers, appliedSpeakerTimbreFilters, appliedSpeakerPaceFilters]);

  const numOfSpeakers = useMemo(() => {
    // Count the total number of speakers in the speakerGroups
    return Object.values(speakerGroups).reduce((acc, curr) => acc + curr.size, 0);
  }, [speakerGroups]);

  // When the speakerGroups change, we want to update the parent component with the filtered speakers
  useEffect(() => {
    onFilterSpeakers(speakerGroups);
  }, [speakerGroups, onFilterSpeakers]);

  const TIMBRE_BUTTONS = [
    {
      name: 'Feminine',
      value: SpeakerTimbreFilters.Feminine,
    },
    {
      name: 'Masculine',
      value: SpeakerTimbreFilters.Masculine,
    },
  ];

  const PACE_BUTTONS = [
    {
      name: 'Fast Pace',
      value: PaceDescription.Fast,
    },
    {
      name: 'Standard',
      value: PaceDescription.Standard,
    },
    {
      name: 'Slow Pace',
      value: PaceDescription.Slow,
    },
  ];

  return (
    <div className={styles.VOSpeakerModalContainer}>
      <div className={styles.VOSpeakerModalFilters}>
        {TIMBRE_BUTTONS.map(({ name, value }) => (
          <WaymarkButton
            key={value}
            className={styles.VOSpeakerModalFilterButton}
            isSmall
            onClick={() => selectTimbreFilter(value)}
            colorTheme={appliedSpeakerTimbreFilters.includes(value) ? 'Primary' : 'Tertiary'}
          >
            {name}
          </WaymarkButton>
        ))}
      </div>
      <div className={styles.VOSpeakerModalFilters}>
        {PACE_BUTTONS.map(({ name, value }) => (
          <WaymarkButton
            key={value}
            className={styles.VOSpeakerModalFilterButton}
            isSmall
            onClick={() => selectPaceFilter(value)}
            colorTheme={appliedSpeakerPaceFilters.includes(value) ? 'Primary' : 'Tertiary'}
          >
            {name}
          </WaymarkButton>
        ))}
      </div>
      <div className={styles.VOSpeakerModalFilterDetails}>
        <p>{numOfSpeakers} Total</p>
      </div>
    </div>
  );
}
