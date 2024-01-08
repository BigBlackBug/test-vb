import {
  lightGrayBorderColor,
  orangeColor,
  yellowTimelineColor,
} from 'styles/themes/waymark/colors.js';

// ratio definitions for AI VO script length indicator
// these ratios are the speaker's estimated speaking time / videoDuration
export const MIN_LITTLE_SHORT_RATIO = 0.75;
export const TOO_LONG_RATIO = 1.4;
export const MIN_GOOD_RATIO = 0.92;
export const MAX_GOOD_RATIO = 1.07;

export const DERIVATIVES = {
  downloadRender: 'downloadRender',
  webPlayer: 'webPlayer',
};

// WellSaid Labs, the service which we use for automated voice over, has a limit of 1000 characters for generations.
// Eventually, we're going to figure out a way to split up scripts that are too long and stitch the audio files together, but for now
// we're just going to limit the script length which users are allowed to enter to 1000 characters.
export const MAX_VOICE_OVER_SCRIPT_LENGTH = 1000;

// Used as keys to determine which script length quality indicator to show
export enum ScriptLengthQuality {
  VeryShort,
  LittleShort,
  Good,
  LittleLong,
  TooLong,
  ExceedsCharacterLimit,
  NoSpeaker,
}

export const scriptQualityIndicatorValues: {
  [key in ScriptLengthQuality]: { message: string; color: string };
} = {
  [ScriptLengthQuality.VeryShort]: {
    message: 'VERY SHORT',
    color: orangeColor,
  },
  [ScriptLengthQuality.LittleShort]: {
    message: 'A LITTLE SHORT',
    color: yellowTimelineColor,
  },
  [ScriptLengthQuality.Good]: {
    message: 'LOOKS GOOD',
    color: lightGrayBorderColor,
  },
  [ScriptLengthQuality.LittleLong]: {
    message: 'A LITTLE LONG',
    color: yellowTimelineColor,
  },
  [ScriptLengthQuality.TooLong]: {
    message: 'TOO LONG',
    color: orangeColor,
  },
  [ScriptLengthQuality.ExceedsCharacterLimit]: {
    message: 'TOO MANY CHARACTERS',
    color: orangeColor,
  },
  [ScriptLengthQuality.NoSpeaker]: {
    message: 'NO SPEAKER SELECTED',
    color: orangeColor,
  },
};
