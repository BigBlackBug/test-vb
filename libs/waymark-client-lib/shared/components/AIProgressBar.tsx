// Vendor
import { css, keyframes, cx as emotionClassNames } from '@emotion/css';

import { brandItGradient } from 'styles/themes/waymark/colors.js';

import ProgressBar, { ProgressBarProps } from './ProgressBar';

const PROGRESS_BAR_SHIMMER_ANIMATION = keyframes`
  from {
    transform: translateX(-100%);
  }

  to {
    transform: translateX(100%);
  }
`;

/**
 * A ProgressBar component with special fancy styles for AI-related loading states, ie in the AI1X flow or the brand-it modal
 */
export default function AIProgressBar({ progressBarClassName, ...props }: ProgressBarProps) {
  return (
    <ProgressBar
      progressBarClassName={emotionClassNames(
        css`
          /* Use our fancy "brand it" gradient in the progress bar */
          background: ${brandItGradient};
          overflow: hidden;

          &::after {
            /* Use ::after to apply a shimmering gradient that animates over the progress bar
               to add a little additional visual interest so it feels like something is happening */
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(
              to right,
              transparent 0%,
              rgba(255, 255, 255, 0.25) 50%,
              transparent 100%
            );
            animation: ${PROGRESS_BAR_SHIMMER_ANIMATION} 2s ease-in infinite;
          }
        `,
        progressBarClassName,
      )}
      {...props}
    />
  );
}
