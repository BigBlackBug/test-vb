// Vendor
import { useMemo } from 'react';
import { css, keyframes, cx as emotionClassNames } from '@emotion/css';

const soundBarPlayingAnimation = keyframes`
  0% {
    opacity: 0.35;
    transform: scaleY(0.2);
  }
  100% {
    opacity: 1;
    height: scaleY(1);
  }
`;

const soundBarStyles = css`
  height: 100%;
  transform-origin: bottom;
  background-color: currentColor;
  animation: ${soundBarPlayingAnimation} 0ms -800ms linear infinite alternate;
`;

interface SoundBarAnimationProps {
  containerClass?: string;
  numberOfBars?: number;
}
/**
 * Shared component that displays psuedo sound bars, i.e., they are not actually timed to audio.
 * Inspired by/stolen from https://codepen.io/jackrugile/pen/CkAbG.
 *
 * @param  {string} options.containerClass  Any additional styles to apply to the container.
 * @param  {int}    options.numberOfBars    The amount of bars the animation should contain.
 */
const SoundBarAnimation = ({
  containerClass = undefined,
  numberOfBars = 5,
}: SoundBarAnimationProps) => {
  const soundBars = useMemo(() => {
    const soundBarNodes = new Array<React.ReactNode>(numberOfBars);
    for (let i = 0; i < numberOfBars; i += 1) {
      // Generate a random number between 400 and 500.
      const animationDuration = Math.floor(Math.random() * (500 - 400 + 1) + 400);

      soundBarNodes.push(
        <div
          className={soundBarStyles}
          style={{
            width: `${100 / numberOfBars}%`,
            animationDuration: `${animationDuration}ms`,
          }}
          key={i}
        />,
      );
    }

    return soundBarNodes;
  }, [numberOfBars]);

  return (
    <div
      className={emotionClassNames(
        css`
          height: 15px;
          display: flex;
          align-items: flex-end;
          gap: 1px;
        `,
        containerClass,
      )}
    >
      {soundBars}
    </div>
  );
};

export default SoundBarAnimation;
