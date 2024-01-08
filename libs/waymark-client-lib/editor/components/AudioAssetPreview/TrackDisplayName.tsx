// Vendor
import { useRef, useState, useEffect } from 'react';
import { css, cx as emotionClassNames } from '@emotion/css';

// Editor
import { keyframes } from '@emotion/react';

// Styles
import { useTypography } from 'styles/hooks/typography.js';

const textMarqueeAnimation = keyframes`
  from {
    transform: translateX(0);
  } to {
    transform: translateX(-50%);
  }
`;

interface AudioTrackDisplayNameProps {
  /**
   * The name of the track to display
   */
  displayName: string;
}

/**
 * Displays the name of the audio track for an AudioAssetPreview, with a marquee animation if the name is too long to fit in the container.
 */
export default function TrackDisplayName({ displayName }: AudioTrackDisplayNameProps) {
  const displayNameElementRef = useRef<HTMLSpanElement>(null);
  const displayNameContainerRef = useRef<HTMLDivElement>(null);

  const [isTextOverflowing, setIsTextOverflowing] = useState(false);

  useEffect(() => {
    // Effect checks if the display name text is too long so that it's overflowing outside of the container;
    // if so, we'll have the text do a marquee animation during playback to reveal the rest of the hidden text.
    const displayNameElement = displayNameElementRef.current;
    const displayNameContainer = displayNameContainerRef.current;
    if (!displayNameElement || !displayNameContainer) return;

    const displayNameElementWidth = displayNameElement.getBoundingClientRect().width;
    const displayNameContainerWidth = displayNameContainer.getBoundingClientRect().width;

    setIsTextOverflowing(displayNameElementWidth - displayNameContainerWidth > -12);
  }, []);

  const [headlineSmallTextStyles] = useTypography(['headlineSmall']);

  return (
    <div
      ref={displayNameContainerRef}
      className={emotionClassNames(
        headlineSmallTextStyles,
        css`
          flex-grow: 1;
          margin-right: 12px;
          overflow: hidden;
          position: relative;
          text-align: left;
          /* Overridding the font size from the headlineSmallText typography
              because it just looks a little better being bumped up by one extra px */
          font-size: 14px;

          &:after {
            content: '';
            position: absolute;
            right: 0;
            top: 0;
            width: 24px;
            height: 100%;
            background: linear-gradient(to left, #fff, rgba(255, 255, 255, 0));
          }
        `,
      )}
    >
      <span
        style={{
          animationDuration: `${isTextOverflowing ? displayName.length * 0.2 : 0}s`,
        }}
        className={css`
          display: inline-block;
          white-space: nowrap;

          [data-ishovering] & {
            animation: ${textMarqueeAnimation} 10s 1s linear infinite;
          }

          span {
            padding-right: 4ch;
          }
        `}
      >
        <span ref={displayNameElementRef}>{displayName}</span>
        {isTextOverflowing ? <span aria-hidden>{displayName}</span> : null}
      </span>
    </div>
  );
}
