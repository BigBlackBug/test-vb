// Local Imports
import {
  whiteVideoIconColor,
  playerControlsBackgroundColor,
} from 'styles/themes/waymark/colors.js';

interface VideoPlayerIconProps extends React.ComponentPropsWithoutRef<'svg'> {
  color?: string;
  title?: string;
}

// A plain play icon
// Used in the desktop video player's control bar when the video is paused
export const PlayIcon = ({
  color = whiteVideoIconColor,
  title = 'Play',
  ...props
}: VideoPlayerIconProps) => (
  <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg" {...props}>
    <title>{title}</title>
    <g stroke="none" fill={color}>
      <path d="M6,5.00087166 C6,4.4481055 6.389052,4.22231543 6.8757627,4.50043583 L18.6954859,11.2545633 C19.4159491,11.6662566 19.4162615,12.3335649 18.6954859,12.7454367 L6.8757627,19.4995642 C6.39209232,19.7759472 6,19.5553691 6,18.9991283 L6,5.00087166 Z" />
    </g>
  </svg>
);

// A play icon with a semi-transparent circle around it
// Used as a start button when the video has loaded
// Used in the mobile video player's floating controls when the video is paused
// Flashed on desktop when the user unpauses the video
export const PlayIconRound = ({
  color = whiteVideoIconColor,
  title = 'Play',
  ...props
}: VideoPlayerIconProps) => (
  <svg viewBox="0 0 76 76" width="76" height="76" xmlns="http://www.w3.org/2000/svg" {...props}>
    <title>{title}</title>
    <g stroke="none" fill="none">
      <rect
        stroke={color}
        strokeWidth="2"
        fill={playerControlsBackgroundColor}
        x="1"
        y="1"
        width="74"
        height="74"
        rx="50%"
      />
      <path
        d="M27,23.3011877 C27,22.1403168 27.8230203,21.6661323 28.8302825,22.2375374 L53.8831634,36.4496689 C55.3926381,37.3059717 55.3814391,38.700666 53.8831634,39.5506157 L28.8302825,53.7627472 C27.8194454,54.3361803 27,53.867265 27,52.6990969 L27,23.3011877 Z"
        fill={color}
      />
    </g>
  </svg>
);

// A plain pause icon
// Used in the desktop video player's control bar when the video is playing
export const PauseIcon = ({
  color = whiteVideoIconColor,
  title = 'Pause',
  ...props
}: VideoPlayerIconProps) => (
  <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg" {...props}>
    <title>{title}</title>
    <g stroke="none" fill={color}>
      <rect x="6" y="4" width="4" height="16" rx="1" />
      <rect x="14" y="4" width="4" height="16" rx="1" />
    </g>
  </svg>
);

// A pause icon with a semi-transparent circle around it
// Used in the mobile video player's floating controls when the video is playing
// Flashed on desktop when the user pauses the video
export const PauseIconRound = ({
  color = whiteVideoIconColor,
  title = 'Pause',
  ...props
}: VideoPlayerIconProps) => (
  <svg viewBox="0 0 76 76" width="76" height="76" xmlns="http://www.w3.org/2000/svg" {...props}>
    <title>{title}</title>
    <g stroke="none" fill="none">
      <rect
        stroke={color}
        strokeWidth="2"
        fill={playerControlsBackgroundColor}
        x="1"
        y="1"
        width="74"
        height="74"
        rx="50%"
      />
      <g transform="translate(14.000000, 14.000000)" fill={color}>
        <rect x="12" y="8" width="8" height="32" rx="2" />
        <rect x="28" y="8" width="8" height="32" rx="2" />
      </g>
    </g>
  </svg>
);

// A plain restart icon
// Used in the desktop video player's control bar
export const RestartIcon = ({ color = whiteVideoIconColor, title = 'Restart', ...props }) => (
  <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg" {...props}>
    <title>{title}</title>
    <g stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
      <path
        transform="translate(12.500000, 13.309524) scale(1, -1) translate(-12.500000, -13.309524) "
        d="M11,20 L12.5,20 C16.0898509,20 19,17.0045718 19,13.3095238 C19,9.61447584 16.0898509,6.61904762 12.5,6.61904762 C8.91014913,6.61904762 6,9.61447584 6,13.3095238"
      />
      <polyline
        transform="translate(10.397059, 6.619048) scale(1, -1) translate(-10.397059, -6.619048) "
        points="11.9411765 3.45238095 8.85294118 6.61904762 11.9411765 9.78571429"
      />
    </g>
  </svg>
);

// A restart icon with a semi-transparent circle around it -
// Used in video player's floating controls on mobile
// Shown when a video has reached the end
export const RestartIconRound = ({ color = whiteVideoIconColor, title = 'Restart', ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="76" height="76" viewBox="0 0 76 76" {...props}>
    <title>{title}</title>
    <g stroke={color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none">
      <rect
        strokeWidth="2"
        fill={playerControlsBackgroundColor}
        x="1"
        y="1"
        width="74"
        height="74"
        rx="50%"
      />
      <path
        d="M35,54 L38,54 C45.1797017,54 51,48.0091436 51,40.6190476 C51,33.2289517 45.1797017,27.2380952 38,27.2380952 C30.8202983,27.2380952 25,33.2289517 25,40.6190476"
        id="Oval-2"
        stroke={color}
        transform="translate(38.000000, 40.619048) scale(1, -1) translate(-38.000000, -40.619048) "
      />
      <polyline
        id="Path-5"
        stroke={color}
        transform="translate(33.794118, 27.238095) scale(1, -1) translate(-33.794118, -27.238095) "
        points="36.8823529 20.9047619 30.7058824 27.2380952 36.8823529 33.5714286"
      />
    </g>
  </svg>
);

/**
 * Used in desktop video player's control bar when video is muted
 */
export const UnmuteIcon = ({
  color = whiteVideoIconColor,
  title = 'Unmute',
  ...props
}: VideoPlayerIconProps) => (
  <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg" {...props}>
    <title>{title}</title>
    <g stroke="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none">
      <path
        d="M16.9775872,19.4994052 C19.402129,17.8869397 21,15.1300712 21,12 C21,8.87770643 19.41006,6.12676325 16.9956455,4.51263603"
        stroke={color}
      />
      <path
        d="M14.3183914,15.9996035 C15.5239076,15.1398117 16.3183914,13.6698063 16.3183914,12.0008035 C16.3183914,10.3359477 15.527851,8.86910187 14.3273703,8.00842402"
        stroke={color}
      />
      <path
        d="M5.18079844,15 L3,15 C2.44771525,15 2,14.5522847 2,14 L2,10 C2,9.44771525 2.44771525,9 3,9 L5.18086412,9 L9.61951407,5.56573228 C10.2655067,5.06591549 10.8034874,5.31698502 10.8034874,6.14016022 L10.8034874,17.8599643 C10.8034874,18.6805924 10.2734045,18.9403127 9.61951407,18.4343767 L5.18079844,15 Z"
        fill={color}
      />
    </g>
  </svg>
);

/**
 * Used in desktop video player's control bar when video is unmuted
 */
export const MuteIcon = ({
  color = whiteVideoIconColor,
  title = 'Mute',
  ...props
}: VideoPlayerIconProps) => (
  <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg" {...props}>
    <title>{title}</title>
    <g stroke="none" fill="none">
      <path
        d="M6,10.7935945 L14.8034874,17.1070796 L14.8034874,17.8599643 C14.8034874,18.6805924 14.2734045,18.9403127 13.6195141,18.4343767 L9.18079844,15 L7,15 C6.44771525,15 6,14.5522847 6,14 L6,10.7935945 Z M10.5747424,7.92152991 L13.6195141,5.56573228 C14.2655067,5.06591549 14.8034874,5.31698502 14.8034874,6.14016022 L14.8034874,10.9542052 L10.5747424,7.92152991 Z"
        fill={color}
      />
      <path
        d="M5,7 L19.1421356,17.1421356"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  </svg>
);

// Used in desktop video player's control bar when video is in full screen
export const ExitFullscreenIcon = ({
  color = whiteVideoIconColor,
  title = 'Exit Fullscreen',
  ...props
}: VideoPlayerIconProps) => (
  <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg" {...props}>
    <title>{title}</title>
    <g stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
      <polyline
        transform="translate(6.000000, 6.000000) scale(-1, -1) translate(-6.000000, -6.000000) "
        points="4 8 4 4 8 4"
      />
      <polyline
        transform="translate(18.000000, 6.000000) scale(-1, -1) translate(-18.000000, -6.000000) "
        points="16 4 20 4 20 8"
      />
      <polyline
        transform="translate(6.000000, 18.000000) scale(-1, -1) translate(-6.000000, -18.000000) "
        points="8 20 4 20 4 16"
      />
      <polyline
        transform="translate(18.000000, 18.000000) scale(-1, -1) translate(-18.000000, -18.000000) "
        points="20 16 20 20 16 20"
      />
    </g>
  </svg>
);

// Used in desktop video player's control bar when video is in normal view
export const EnterFullscreenIcon = ({
  color = whiteVideoIconColor,
  title = 'Enter Fullscreen',
  ...props
}: VideoPlayerIconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" {...props}>
    <title>{title}</title>
    <g stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
      <polyline points="4 8 4 4 8 4" />
      <polyline points="16 4 20 4 20 8" />
      <polyline points="8 20 4 20 4 16" />
      <polyline points="20 16 20 20 16 20" />
    </g>
  </svg>
);

// Loading icon spins over video until configurator is done loading
export const LoadingIcon = ({
  color = whiteVideoIconColor,
  title = 'Loading',
  ...props
}: VideoPlayerIconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80" {...props}>
    <title>{title}</title>
    <g stroke="none" fill="none">
      <rect fill={playerControlsBackgroundColor} x="0" y="0" width="80" height="80" rx="50%" />
      <path
        d="M76,40 C76,59.882251 59.882251,76 40,76 C20.117749,76 4,59.882251 4,40 C4,20.117749 20.117749,4 40,4"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  </svg>
);
