// Local
import {
  PlayIconRound,
  PauseIconRound,
  RestartIconRound,
} from 'shared/components/VideoPlayerIcons';
import { WaymarkButton } from 'shared/components/WaymarkButton';
import { PlaybackState, playbackStates } from 'shared/web_video/constants/videoPlayer';
import { VideoProgressBar } from './VideoProgressBar';

import * as styles from './MobileVideoControls.css';

const stopTouchPropagation: React.TouchEventHandler<HTMLElement> = (event) =>
  event.stopPropagation();

interface MobileVideoControlsProps {
  videoPlaybackState: PlaybackState;
  onClickTogglePlayPause: () => void;
  onClickRestart: () => void;
  goToFrame: (frameNumber: number) => void;
  onScrubStart: () => void;
  onScrubEnd: () => void;
  currentTimeString: string;
  totalTimeString: string;
}

export default function MobileVideoControls({
  videoPlaybackState,
  onClickTogglePlayPause,
  onClickRestart,
  goToFrame,
  onScrubStart,
  onScrubEnd,
  currentTimeString,
  totalTimeString,
}: MobileVideoControlsProps) {
  return (
    <>
      <div className={styles.OverlayControlButtons}>
        <WaymarkButton
          // Prevent touch events on this button from bubbling up to do anything to the controls overlay wrapper
          onTouchEnd={stopTouchPropagation}
          onClick={onClickRestart}
          analyticsAction="selected_restart_video"
          hasFill={false}
          className={styles.ControlsButton}
          {...styles.dataIsButtonVisible(
            videoPlaybackState === playbackStates.ended ||
              videoPlaybackState === playbackStates.playing ||
              videoPlaybackState === playbackStates.paused,
          )}
        >
          <RestartIconRound />
        </WaymarkButton>
        <WaymarkButton
          onTouchEnd={stopTouchPropagation}
          onClick={onClickTogglePlayPause}
          analyticsAction={
            videoPlaybackState === playbackStates.playing
              ? 'selected_pause_video'
              : 'selected_play_video'
          }
          hasFill={false}
          className={styles.ControlsButton}
          {...styles.dataIsButtonVisible(
            videoPlaybackState === playbackStates.waitingToPlay ||
              videoPlaybackState === playbackStates.playing ||
              videoPlaybackState === playbackStates.paused,
          )}
        >
          <PauseIconRound className={styles.PauseIcon} />
          <PlayIconRound className={styles.PlayIcon} />
        </WaymarkButton>
      </div>
      <div className={styles.ControlsSliderContainer} onTouchEnd={stopTouchPropagation}>
        <div className={styles.ControlSliderLabels}>
          <div className={styles.TimeLabel}>{currentTimeString}</div>
          <div className={styles.TimeLabel}>{totalTimeString}</div>
        </div>
        <VideoProgressBar
          onClickTogglePlayPause={onClickTogglePlayPause}
          goToFrame={goToFrame}
          onScrubStart={onScrubStart}
          onScrubEnd={onScrubEnd}
          className={styles.ControlsSlider}
        />
      </div>
    </>
  );
}
