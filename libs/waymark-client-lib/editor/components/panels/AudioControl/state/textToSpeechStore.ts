import { useCallback, useEffect, useMemo, useRef } from 'react';
import { SpeakerMap } from 'libs/tts-lib';
import { create } from 'zustand';
import { useSelector } from 'react-redux';
import { AutofillVideoDescriptorThin, WaymarkServiceAccessKey } from 'libs/shared-types';

// Editor
import {
  MAX_GOOD_RATIO,
  TOO_LONG_RATIO,
  MIN_GOOD_RATIO,
  MIN_LITTLE_SHORT_RATIO,
  MAX_VOICE_OVER_SCRIPT_LENGTH,
  ScriptLengthQuality,
} from 'editor/constants/automatedVoiceOver';
import { useEditorVideoContext } from 'editor/providers/EditorVideoProvider.js';
import { useEditorState } from 'editor/providers/EditorStateProvider.js';

// Shared
import textToSpeechService from 'shared/services/TextToSpeechService';
import audioProcessingService from 'shared/services/AudioProcessingService';
import { createAccountAudioAsset } from 'shared/api/index.js';

// WAYMARK APP DEPENDENCIES
import * as selectors from 'app/state/selectors/index.js';
import { AudioSources } from 'app/models/accountAudioAssets/types';
import VoiceoverRewriteService from 'shared/services/VoiceoverRewriteService';

interface TextToSpeechStore {
  loadedSpeakers: SpeakerMap | null;
  isLoadingSpeakers: boolean;
  selectedSpeakerGUID: string | null;
  scriptText: string;
  isGeneratingVO: boolean;
  isRewritingScript: boolean;
  lastGeneratedScript: string;
  lastGeneratedSpeakerGUID: string;
  isVOUpToDate: boolean;
  isVOUpToDateWarningDismissed: boolean;
  voGenerationErrorMessage: string | null;
  actions: {
    loadSpeakers: (serviceAccessKey: WaymarkServiceAccessKey) => Promise<void>;
    setSelectedSpeakerGUID: (speakerGUID: string, isBeingInitialized?: boolean) => void;
    setScriptText: (scriptText: string, isBeingInitialized?: boolean) => void;
    rewriteScript: (
      videoDescriptor: AutofillVideoDescriptorThin,
      businessGUID: string,
      speakerPace?: number,
    ) => Promise<void>;
    dismissVOUpToDateWarning: () => void;
    generateVoiceOver: (
      accountGUID: string,
      serviceAccessKey: WaymarkServiceAccessKey,
      duration?: number,
    ) => Promise<string | null>;
  };
}

/**
 * Zustand store manages Text-to-Speech SDK state:
 * - Loading available TTS speakers
 * - Generating voice-over tracks
 */
const useTextToSpeechStore = create<TextToSpeechStore>((set, get) => ({
  loadedSpeakers: null,
  isLoadingSpeakers: false,
  selectedSpeakerGUID: null,
  scriptText: '',
  isGeneratingVO: false,
  isRewritingScript: false,
  lastGeneratedScript: '',
  lastGeneratedSpeakerGUID: '',
  isVOUpToDate: true,
  isVOUpToDateWarningDismissed: false,
  voGenerationErrorMessage: null,
  actions: {
    /**
     * Loads the available TTS speakers from the TTS SDK
     *
     * @param {WaymarkServiceAccessKey} serviceAccessKey - Access key which we'll provide to the TTS SDK
     */
    loadSpeakers: async (serviceAccessKey: WaymarkServiceAccessKey) => {
      const { isLoadingSpeakers, loadedSpeakers } = get();
      if (loadedSpeakers || isLoadingSpeakers) {
        return;
      }

      try {
        set({ isLoadingSpeakers: true });

        const speakerMap = await textToSpeechService.getSpeakers(serviceAccessKey);

        set({ loadedSpeakers: speakerMap });
      } catch (err) {
        console.error('Failed to load voiceover speakers', err);
      } finally {
        set({ isLoadingSpeakers: false });
      }
    },
    /**
     * Updates the currently selected TTS speaker GUID
     *
     * @param {string} speakerGUID
     */
    setSelectedSpeakerGUID: (speakerGUID: string, isBeingInitialized = false) => {
      if (
        (get().lastGeneratedSpeakerGUID !== speakerGUID ||
          get().lastGeneratedScript !== get().scriptText) &&
        !isBeingInitialized
      ) {
        set({ isVOUpToDate: false });
      } else {
        if (isBeingInitialized) {
          set({ lastGeneratedSpeakerGUID: speakerGUID });
        }

        set({ isVOUpToDate: true });
      }

      set({ selectedSpeakerGUID: speakerGUID });
    },
    /**
     * Updates the VO script text
     *
     * @param {string} scriptText
     */
    setScriptText: (scriptText: string, isBeingInitialized = false) => {
      if (
        (get().lastGeneratedSpeakerGUID !== get().selectedSpeakerGUID ||
          get().lastGeneratedScript !== scriptText) &&
        !isBeingInitialized
      ) {
        set({ isVOUpToDate: false });
      } else {
        if (isBeingInitialized) {
          set({ lastGeneratedScript: scriptText });
        }

        set({ isVOUpToDate: true });
      }

      set({ scriptText });
    },
    /**
     * Rewrites the script text based on the video descriptor
     *
     * @param {AutofillVideoDescriptorThin} videoDescriptor - The video descriptor to use for rewriting the script
     * @param {string} businessGUID - The business GUID to use for rewriting the script
     *
     * @returns {Promise<void>}
     */
    rewriteScript: async (
      videoDescriptor: AutofillVideoDescriptorThin,
      businessGUID: string,
      speakerPace?: number,
    ) => {
      if (!videoDescriptor) {
        set({ voGenerationErrorMessage: 'An unknown error occurred. Please try again.' });
        return;
      }

      try {
        set({ isRewritingScript: true });
        const newScript = await VoiceoverRewriteService.rewriteVoiceover(
          videoDescriptor,
          businessGUID,
          speakerPace,
        );

        if (newScript) {
          if (
            get().lastGeneratedSpeakerGUID !== get().selectedSpeakerGUID ||
            get().lastGeneratedScript !== newScript
          ) {
            set({ isVOUpToDate: false });
          } else {
            set({ isVOUpToDate: true });
          }

          set({ scriptText: newScript, voGenerationErrorMessage: null });
        }
      } catch (e) {
        set({ voGenerationErrorMessage: 'An unknown error occurred. Please try again.' });
        console.error('An unknown error occurred while rewriting the voiceover script.');
      }
      set({ isRewritingScript: false });
    },
    /**
     * Dismisses the voice-over up-to-date warning
     */
    dismissVOUpToDateWarning: () => {
      set({ isVOUpToDateWarningDismissed: true });
    },
    /**
     * Generates a VO track with the TTS SDK for the currently selected speaker and script text,
     * and saves the resulting audio file to the account's audio assets.
     *
     * @param {string} accountGUID - The user's account GUID which we will use for saving the audio asset
     * @param {WaymarkServiceAccessKey} serviceAccessKey - Access key which we'll provide to the TTS SDK
     *
     * @returns {Promise<string | null>} - The source key of the generated audio asset, or null if there was an error
     */
    generateVoiceOver: async (
      accountGUID: string,
      serviceAccessKey: WaymarkServiceAccessKey,
      videoDuration?: number,
    ) => {
      const { selectedSpeakerGUID, scriptText, loadedSpeakers } = get();

      const selectedSpeaker =
        selectedSpeakerGUID && loadedSpeakers ? loadedSpeakers.get(selectedSpeakerGUID) : null;

      if (!selectedSpeaker || !selectedSpeakerGUID) {
        set({
          voGenerationErrorMessage: 'Please select a voice to read your script.',
        });
        return null;
      }

      if (!scriptText) {
        set({
          voGenerationErrorMessage: 'Please provide a script.',
        });
        return null;
      }

      try {
        set({ isGeneratingVO: true, voGenerationErrorMessage: null });

        const generatedAudioFileData = await textToSpeechService.textToSpeech(
          scriptText,
          selectedSpeakerGUID,
          serviceAccessKey,
        );
        // Process the generated audio file with the APS
        const { sourceKey, duration } = await audioProcessingService.processAudioData(
          generatedAudioFileData,
          serviceAccessKey,
          videoDuration,
        );

        const speakerName = selectedSpeaker.name;

        // Create an AccountAudioAsset record in the DB for the asset we just generated and processed
        await createAccountAudioAsset(accountGUID, sourceKey, {
          displayName: `${speakerName} - AI`,
          duration,
          source: AudioSources.Generated,
        });

        set({
          isGeneratingVO: false,
          isVOUpToDate: true,
          isVOUpToDateWarningDismissed: false,
          lastGeneratedScript: scriptText,
          lastGeneratedSpeakerGUID: selectedSpeakerGUID,
        });

        return sourceKey;
      } catch (error) {
        console.error('Error while generating voice-over', error);
        set({
          voGenerationErrorMessage:
            'There was an error generating the voice-over. Please try again.',
          isGeneratingVO: false,
        });
      }

      return null;
    },
  },
}));

/**
 * Load and return a Map of all available TTS speakers
 */
export const useTTSSpeakers = () => {
  const loadedSpeakers = useTextToSpeechStore((store) => store.loadedSpeakers);
  const isLoadingSpeakers = useTextToSpeechStore((store) => store.isLoadingSpeakers);

  const serviceAccessKey = useSelector(selectors.getServiceAccessToken);
  const { loadSpeakers } = useTextToSpeechStore((store) => store.actions);

  useEffect(() => {
    if (serviceAccessKey) {
      loadSpeakers(serviceAccessKey);
    }
  }, [loadSpeakers, serviceAccessKey]);

  return { speakers: loadedSpeakers, isLoadingSpeakers };
};

/**
 * Return the Speaker instance for the currently selected speaker,
 * as well as a function to select a new speaker.
 */
export const useSelectedSpeaker = () => {
  const { appliedAIVoiceOverSpeakerGUID } = useEditorState();
  const previousAppliedAIVOSpeakerGUIDRef = useRef<string>();

  const selectedSpeakerGUID = useTextToSpeechStore((store) => store.selectedSpeakerGUID);
  const { speakers, isLoadingSpeakers } = useTTSSpeakers();

  const { setSelectedSpeakerGUID } = useTextToSpeechStore((store) => store.actions);

  useEffect(() => {
    // If the applied AI VO speaker has changed, make sure that our selected
    // speaker is updated to keep the UI in sync
    if (previousAppliedAIVOSpeakerGUIDRef.current !== appliedAIVoiceOverSpeakerGUID) {
      previousAppliedAIVOSpeakerGUIDRef.current = appliedAIVoiceOverSpeakerGUID;

      if (appliedAIVoiceOverSpeakerGUID !== selectedSpeakerGUID) {
        setSelectedSpeakerGUID(appliedAIVoiceOverSpeakerGUID, true);
      }
    }
  }, [appliedAIVoiceOverSpeakerGUID, selectedSpeakerGUID, setSelectedSpeakerGUID]);

  const selectedSpeaker =
    selectedSpeakerGUID && speakers ? speakers.get(selectedSpeakerGUID) : null;

  return { selectedSpeaker, setSelectedSpeakerGUID, isLoading: isLoadingSpeakers };
};

/**
 * Return the current VO script text, as well as a function to set the script text.
 */
export const useVoiceOverScript = () => {
  const { appliedAIVoiceOverText } = useEditorState();
  const previousAppliedAIVOTextRef = useRef<string>();

  const scriptText = useTextToSpeechStore((store) => store.scriptText);
  const { setScriptText } = useTextToSpeechStore((store) => store.actions);

  useEffect(() => {
    // If the applied AI VO text has changed, make sure that our script text
    // is updated to keep the UI in sync
    if (previousAppliedAIVOTextRef.current !== appliedAIVoiceOverText) {
      previousAppliedAIVOTextRef.current = appliedAIVoiceOverText;

      if (appliedAIVoiceOverText !== scriptText) {
        setScriptText(appliedAIVoiceOverText, true);
      }
    }
  }, [appliedAIVoiceOverText, scriptText, setScriptText]);

  return { scriptText, setScriptText };
};

export const useRewriteScript = () => {
  const { rewriteScript } = useTextToSpeechStore((store) => store.actions);
  const isRewritingScript = useTextToSpeechStore((store) => store.isRewritingScript);
  return { isRewritingScript, rewriteScript };
};

/**
 * Hook returns the quality of the current VO script based on the ratio of the speaker's estimated read-time
 * to the total available duration of the video.
 */
export const useScriptLengthQuality = () => {
  const { selectedSpeaker } = useSelectedSpeaker();
  const scriptText = useTextToSpeechStore((store) => store.scriptText);

  const { editorVariant } = useEditorVideoContext();

  const scriptLengthQuality = useMemo(() => {
    // Return a special value if the script exceeds our character limit; this means the script
    // is too long to be processed by the TTS so submissions should be disableds
    if (scriptText.length > MAX_VOICE_OVER_SCRIPT_LENGTH) {
      return ScriptLengthQuality.ExceedsCharacterLimit;
    }

    // Return a special value if there is no selected speaker; submissions should be disabled
    // until the user has provided both a speaker and script
    if (!selectedSpeaker) {
      return ScriptLengthQuality.NoSpeaker;
    }

    const estimatedReadingTime = selectedSpeaker.estimateDuration(scriptText || '');
    const readingTimeToAvailableTimeRatio = estimatedReadingTime / editorVariant.displayDuration;

    if (
      readingTimeToAvailableTimeRatio >= MIN_GOOD_RATIO &&
      readingTimeToAvailableTimeRatio <= MAX_GOOD_RATIO
    ) {
      return ScriptLengthQuality.Good;
    }
    if (
      readingTimeToAvailableTimeRatio >= MIN_LITTLE_SHORT_RATIO &&
      readingTimeToAvailableTimeRatio < MIN_GOOD_RATIO
    ) {
      return ScriptLengthQuality.LittleShort;
    }
    if (
      readingTimeToAvailableTimeRatio <= TOO_LONG_RATIO &&
      readingTimeToAvailableTimeRatio > MAX_GOOD_RATIO
    ) {
      return ScriptLengthQuality.LittleLong;
    }
    if (readingTimeToAvailableTimeRatio > TOO_LONG_RATIO) {
      return ScriptLengthQuality.TooLong;
    }

    return ScriptLengthQuality.VeryShort;
  }, [selectedSpeaker, scriptText, editorVariant.displayDuration]);

  return scriptLengthQuality;
};

/**
 * Returns a function which generates a voice-over track for the currently selected speaker and script
 * and saves it to the user's account.
 *
 * Also returns values to track the current status of the voice-over generation process.
 */
export const useGenerateVoiceOver = () => {
  const serviceAccessKey = useSelector(selectors.getServiceAccessToken);
  const accountGUID = useSelector(selectors.getAccountGUID);

  const isGeneratingVO = useTextToSpeechStore((store) => store.isGeneratingVO);
  const voGenerationErrorMessage = useTextToSpeechStore((store) => store.voGenerationErrorMessage);

  const { generateVoiceOver } = useTextToSpeechStore((store) => store.actions);

  const generateVoiceOverForAccount = useCallback(
    async (duration?: number) => {
      if (!accountGUID || !serviceAccessKey) {
        return null;
      }

      return generateVoiceOver(accountGUID, serviceAccessKey, duration);
    },
    [accountGUID, generateVoiceOver, serviceAccessKey],
  );

  return {
    isGeneratingVO,
    voGenerationErrorMessage,
    generateVoiceOver: generateVoiceOverForAccount,
  };
};

export const useIsVoiceOverUpToDate = () => {
  const isVOUpToDate = useTextToSpeechStore((store) => store.isVOUpToDate);
  return isVOUpToDate;
};

export const useShouldShowVoiceOverUpToDateWarning = () => {
  const isVOUpToDate = useIsVoiceOverUpToDate();
  const isVOUpToDateWarningDismissed = useTextToSpeechStore(
    (store) => store.isVOUpToDateWarningDismissed,
  );

  const shouldShowVoiceOverUpToDateWarning = !isVOUpToDate && !isVOUpToDateWarningDismissed;

  const dismissVOUpToDateWarning = useTextToSpeechStore(
    (store) => store.actions.dismissVOUpToDateWarning,
  );

  return { shouldShowVoiceOverUpToDateWarning, dismissVOUpToDateWarning };
};
