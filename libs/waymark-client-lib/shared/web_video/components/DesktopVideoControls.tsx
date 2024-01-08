// Vendor
import { useState } from 'react';
import classNames from 'classnames';

// Local
import { VideoProgressBar } from './VideoProgressBar';
import {
  PlayIcon,
  PauseIcon,
  RestartIcon,
  RestartIconRound,
  MuteIcon,
  UnmuteIcon,
  EnterFullscreenIcon,
  ExitFullscreenIcon,
} from 'shared/components/VideoPlayerIcons';
import { WaymarkButton } from 'shared/components/WaymarkButton';
import useEvent from 'shared/hooks/useEvent';

import { PlaybackState, playbackStates } from 'shared/web_video/constants/videoPlayer';
import type WaymarkAuthorConfigurator from '../configurator/WaymarkAuthorConfigurator';

import { dataIsIconVisible } from './VideoPlayer.css';
import * as styles from './DesktopVideoControls.css';

interface DesktopVideoControlsProps {
  configurator: WaymarkAuthorConfigurator;
  videoPlaybackState: PlaybackState;
  onClickTogglePlayPause: () => void;
  onClickRestart: () => void;
  goToFrame: (frameNumber: number) => void;
  onScrubStart: () => void;
  onScrubEnd: () => void;
  currentTimeString: string;
  totalTimeString: string;
  showControls: () => void;
  isFullScreen: boolean;
  onClickToggleFullScreen: () => void;
}

export default function DesktopVideoControls({
  configurator,
  videoPlaybackState,
  onClickTogglePlayPause,
  onClickRestart,
  goToFrame,
  onScrubStart,
  onScrubEnd,
  currentTimeString,
  totalTimeString,
  showControls,
  isFullScreen,
  onClickToggleFullScreen,
}: DesktopVideoControlsProps) {
  const isPlaying = videoPlaybackState === playbackStates.playing;

  const [isMuted, setIsMuted] = useState(() => configurator.isMuted());

  const onClickToggleMute = useEvent(() => {
    if (configurator.isMuted()) {
      configurator.unmute();
    } else {
      configurator.mute();
    }

    setIsMuted(configurator.isMuted());
  });

  return (
    <>
      {/* Button covers all of the player and plays/pauses the video when clicked */}
      <WaymarkButton
        onClick={onClickTogglePlayPause}
        analyticsAction={isPlaying ? 'selected_pause_video' : 'selected_play_video'}
        hasFill={false}
        className={styles.PlayPauseButtonBackground}
        aria-hidden
        tabIndex={-1}
      />
      <WaymarkButton
        onClick={onClickRestart}
        analyticsAction="selected_restart_video"
        hasFill={false}
        className={styles.RestartButton}
        colorTheme="WhiteText"
        // Show the icon when the video is ended, otherwise hide it
        {...dataIsIconVisible(videoPlaybackState === playbackStates.ended)}
      >
        {/* WaymarkButton attempts to override styles of direct descendant SVGs to match its theme, which is almost always
            helpful but unfortunately not in this case. Wrapping the icon in a span so that it's not technically a direct
            descendant in order to get around this */}
        <span>
          <RestartIconRound />
        </span>
      </WaymarkButton>
      <div className={styles.ControlBar}>
        <div
          className={styles.ControlBarContents}
          onMouseMove={(event) => {
            // If the user moves their mouse over the control bar, stop the propogation of the onMouseMove event beyond this element
            // so we can keep the controls open until the user moves their mouse off of the controls
            event.stopPropagation();
            showControls();
          }}
          role="toolbar"
        >
          <VideoProgressBar
            onClickTogglePlayPause={onClickTogglePlayPause}
            goToFrame={goToFrame}
            onScrubStart={onScrubStart}
            onScrubEnd={onScrubEnd}
          />
          <div className={styles.ControlBarButtons}>
            <WaymarkButton
              onClick={onClickTogglePlayPause}
              colorTheme="WhiteText"
              analyticsAction={isPlaying ? 'selected_pause_video' : 'selected_play_video'}
              hasFill={false}
              className={styles.ControlBarButton}
            >
              {isPlaying ? <PauseIcon /> : <PlayIcon />}
            </WaymarkButton>
            <WaymarkButton
              onClick={onClickRestart}
              colorTheme="WhiteText"
              analyticsAction="selected_restart_video"
              hasFill={false}
              className={styles.ControlBarButton}
            >
              <RestartIcon />
            </WaymarkButton>
            <WaymarkButton
              onClick={onClickToggleMute}
              colorTheme="WhiteText"
              analyticsAction={isMuted ? 'selected_unmute' : 'selected_unmute'}
              hasFill={false}
              className={styles.ControlBarButton}
            >
              {isMuted ? <MuteIcon title="Unmute Audio" /> : <UnmuteIcon title="Mute Audio" />}
            </WaymarkButton>
            <div className={styles.TimeLabel}>
              {currentTimeString} / {totalTimeString}
            </div>
            <WaymarkButton
              onClick={onClickToggleFullScreen}
              colorTheme="WhiteText"
              analyticsAction={isFullScreen ? 'selected_fullscreen' : 'selected_exit_fullscreen'}
              hasFill={false}
              className={classNames(styles.ControlBarButton, styles.FullscreenButton)}
            >
              {isFullScreen ? <ExitFullscreenIcon /> : <EnterFullscreenIcon />}
            </WaymarkButton>
          </div>
        </div>
      </div>
    </>
  );
}
