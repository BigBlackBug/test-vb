import voca from 'voca';

import { Language, SupportedLanguages } from './language';
import { ProviderConfiguration } from './configuration';

export const DEFAULT_PACE = 2.5;

export const enum PaceDescription {
  Fast = 'Fast',
  Slow = 'Slow',
  Standard = 'Standard',
}

/**
 * A left-closed interval [left, right).
 */
export class PaceInterval {
  constructor(public left: number, public right: number) {}

  contains(x: number) {
    return this.left <= x && x < this.right;
  }
}

export class PaceBand {
  constructor(public description: PaceDescription, public interval: PaceInterval) {}
}

export const PACE_BANDS: PaceBand[] = [
  new PaceBand(PaceDescription.Slow, new PaceInterval(0, 2.5)),
  new PaceBand(PaceDescription.Standard, new PaceInterval(2.5, 2.75)),
  new PaceBand(PaceDescription.Fast, new PaceInterval(2.75, Infinity)),
];

export type ProviderSpeakerID = string | number;

export class Speaker {
  /**
   * Our ID for the speaker.
   */
  public id: string;

  /**
   * The speaker's provider.
   */
  public providerName: string;

  /**
   * The provider's ID for the speaker.
   */
  public idAtProvider: ProviderSpeakerID;

  /**
   * The speaker's name.
   */
  public name: string;

  /**
   * The provider's description of the speaker's style.
   */
  public providerStyles: string[];

  public language: Language;

  /**
   * Could be alto to bass, breathy, husky, rich, mellow. But it's just masculine or feminine for now.
   */
  public timbre: string[];

  /**
   * The speaker's pace in words per second.
   */
  public pace: number;

  /**
   * The URL of the speaker's preview audio.
   */
  public previewURL?: string;

  /**
   * Return the description of the speaker's pace.
   */
  public get paceDescription() {
    for (const band of PACE_BANDS) {
      if (band.interval.contains(this.pace)) {
        return band.description;
      }
    }

    return null;
  }

  constructor(speakerData: SpeakerData) {
    const language = SupportedLanguages[speakerData.language?.code];
    if (!language) {
      throw new Error('Speaker must have a supported language.');
    }

    this.id = speakerData.id;
    this.providerName = speakerData.providerName;
    this.idAtProvider = speakerData.idAtProvider;
    this.name = speakerData.name;
    this.providerStyles = speakerData.providerStyles;
    this.language = language;
    this.timbre = speakerData.timbre;
    this.pace = speakerData.pace || DEFAULT_PACE;
    this.previewURL = speakerData.previewURL;
    this.language = language;
  }

  /**
   * Returns the speaker in a form that can be shipped around in JSON APIs.
   *
   * I hate this. Don't @ me.
   */
  public asSpeakerData(): SpeakerData {
    return {
      id: this.id,
      idAtProvider: this.idAtProvider,
      providerName: this.providerName,
      name: this.name,
      providerStyles: this.providerStyles,
      language: this.language,
      timbre: this.timbre,
      pace: this.pace,
      previewURL: this.previewURL,
    };
  }

  public estimateDuration(text: string): number {
    const estimate = voca.countWords(text) / this.pace;
    return Number.parseFloat(estimate.toFixed(2));
  }
}

export type SpeakerData = Omit<
  Speaker,
  'asSpeakerData' | 'estimateDuration' | 'paceDescription' | 'provider' | 'pace'
> & {
  providerName: string;
  pace?: number;
};

export type PaceRange = {
  min: number;
  max: number;
};

export class SpeakerMap extends Map<string, Speaker> {
  /**
   * Returns a list of the speakers, sorted by name.
   */
  asList(): Speaker[] {
    return Array.from(this.values()).sort((a, b) => {
      return a.language.code.localeCompare(b.language.code) || a.name.localeCompare(b.name);
    });
  }

  /**
   * Returns the map represented as a Record, so it can be easily conveyed in JSON.
   */
  asSpeakerDataRecords(): Record<string, SpeakerData> {
    return Object.fromEntries(
      this.asList().map((speaker) => [speaker.id, speaker.asSpeakerData()]),
    );
  }

  filter(filterCallback: (speaker: Speaker) => boolean): SpeakerMap {
    const filteredMap = new SpeakerMap();

    for (const [speakerID, speaker] of this.entries()) {
      if (filterCallback(speaker)) {
        filteredMap.set(speakerID, speaker);
      }
    }

    return filteredMap;
  }

  /**
   * Returns the subset of speakers with the given language code.
   */
  filterByLanguage(code: string): SpeakerMap {
    const exactMatches = this.filter((speaker) => speaker.language.code == code);

    if (exactMatches.size > 0) {
      return exactMatches;
    }

    // if nothing matched, maybe the code is just a language, without region
    return this.filter((speaker) => speaker.language.getBaseLanguageCode() == code);
  }

  /**
   * Returns the subset of speakers matching the given pace description.
   */
  filterByPace(paceDescription: PaceDescription): SpeakerMap {
    return this.filter((speaker) => speaker.paceDescription == paceDescription);
  }

  /**
   * Returns the subset of speakers matching the given pace description.
   */
  filterByTimbre(timbre: string): SpeakerMap {
    return this.filter((speaker) => speaker.timbre.includes(timbre));
  }

  /**
   * Group by language.
   */
  groupByLanguage(): Record<string, SpeakerMap> {
    const speakersByLanguage: Map<string, SpeakerMap> = new Map();
    for (const speaker of this.asList()) {
      const key = `${speaker.language.language} (${speaker.language.getRegionCode()})`;
      let speakers = speakersByLanguage.get(key);
      if (!speakers) {
        speakers = new SpeakerMap();
        speakersByLanguage.set(key, speakers);
      }
      speakers.set(speaker.id, speaker);
    }
    const enUS = 'English (US)';
    const record: Record<string, SpeakerMap> = {};
    const englishSpeakers = speakersByLanguage.get(enUS);
    if (englishSpeakers) {
      record[enUS] = englishSpeakers;
    }
    for (const [language, speakerMap] of speakersByLanguage.entries()) {
      if (language != enUS) {
        record[language] = speakerMap;
      }
    }
    return record;
  }

  /**
   * Merge another SpeakerMap into this one.
   */
  merge(speakerMap: SpeakerMap): SpeakerMap {
    for (const speaker of speakerMap.values()) {
      if (this.has(speaker.id)) {
        throw new Error(`Cannot add duplicate speaker ID ${speaker.id}`);
      }
      this.set(speaker.id, speaker);
    }
    return this;
  }

  multiFilter(filters: {
    timbre?: Array<string> | null;
    language?: Array<string> | null;
    pace?: Array<PaceDescription> | null;
  }): SpeakerMap {
    return this.filter((speaker) => {
      if (filters.timbre && !speaker.timbre.find((timbre) => filters.timbre?.includes(timbre))) {
        // return false if the speaker didn't match the timbre filter
        return false;
      }

      if (
        filters.pace &&
        (!speaker.paceDescription || !filters.pace.includes(speaker.paceDescription))
      ) {
        // return false if the speaker didn't match the pace filter
        return false;
      }

      if (filters.language && !filters.language.includes(speaker.language.code)) {
        // return false if the speaker didn't match the language filter
        return false;
      }

      return true;
    });
  }

  getPaceRange(): PaceRange {
    const speakersSortedByPace = this.asList()
      .map((speaker) => speaker.pace)
      .sort();
    const min = speakersSortedByPace[0];
    const max = speakersSortedByPace[speakersSortedByPace.length - 1];
    return { min, max };
  }
}

export interface TextToSpeechProvider {
  /**
   * Retrieve the provider's configuration.
   */
  getConfiguration(): Promise<ProviderConfiguration>;

  /**
   * Returns the name of this provider.
   */
  getName(): string;

  /**
   * Returns the Speaker record for the given ID.
   */
  getSpeaker(speakerID: string): Speaker | null;

  /**
   * Creates preview audio for a speaker.
   */
  previewSpeaker(speakerID: string, timeout: number, overwrite?: boolean): Promise<Speaker>;

  /**
   * Returns all the provider's Speakers.
   */
  getSpeakers(): SpeakerMap;

  /**
   * Perform whatever initialization the provider requires.
   */
  initialize(): Promise<void>;

  /**
   * Submits text to be voiced by the given Speaker.
   *
   * This will submit a TTS request to the provider with callProvider.
   */
  textToSpeech(text: string, speakerID: string, timeout: number): Promise<Buffer>;
}

export class ProviderMap extends Map<string, TextToSpeechProvider> {
  addProvider(provider: TextToSpeechProvider): void {
    this.set(provider.getName(), provider);
  }
}
