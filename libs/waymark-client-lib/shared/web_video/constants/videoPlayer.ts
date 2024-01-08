export const playbackStates = {
  loading: 'loading',
  waitingToPlay: 'waitingToPlay',
  loadingChanges: 'loadingChanges',
  paused: 'paused',
  playing: 'playing',
  ended: 'ended',
} as const;

export type PlaybackState = (typeof playbackStates)[keyof typeof playbackStates];
