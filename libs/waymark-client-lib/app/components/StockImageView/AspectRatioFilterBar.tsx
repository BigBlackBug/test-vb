import {
  AllAspectRatiosIcon,
  TallAspectRatioIcon,
  WideAspectRatioIcon,
  SquareAspectRatioIcon,
} from 'app/icons/VideoIcons';
import { WaymarkButton } from 'shared/components/WaymarkButton';
import {
  AspectRatio,
  useAspectRatio,
  useImages,
  useSubmitSearchImages,
} from './state/stockImageSearchStore';

import * as styles from './AspectRatioFilterBar.css';

const filterButtons: Array<{
  icon: React.ReactNode;
  aspectRatio: AspectRatio;
  name: string;
}> = [
  {
    icon: <AllAspectRatiosIcon />,
    aspectRatio: AspectRatio.All,
    name: 'All',
  },
  {
    icon: <TallAspectRatioIcon />,
    aspectRatio: AspectRatio.Tall,
    name: 'Tall',
  },
  {
    icon: <WideAspectRatioIcon />,
    aspectRatio: AspectRatio.Wide,
    name: 'Wide',
  },
  {
    icon: <SquareAspectRatioIcon />,
    aspectRatio: AspectRatio.Square,
    name: 'Square',
  },
];

export default function AspectRatioFilterBar() {
  const [currentAspectRatio, setCurrentAspectRatio] = useAspectRatio();

  const images = useImages();
  const hasActiveSearch = Boolean(images);
  const submitSearchImages = useSubmitSearchImages();

  return (
    <div
      className={styles.FilterBarContainer}
      role="radiogroup"
      aria-label="Filter images by aspect ratio"
    >
      {filterButtons.map(({ aspectRatio, name, icon }) => {
        const isSelected = currentAspectRatio === aspectRatio;

        return (
          <WaymarkButton
            key={aspectRatio}
            onClick={() => {
              if (!isSelected) {
                setCurrentAspectRatio(aspectRatio);
                if (hasActiveSearch) {
                  // If we have an active search, re-submit with the new aspect ratio
                  submitSearchImages();
                }
              }
            }}
            className={styles.AspectRatioButton}
            colorTheme={isSelected ? 'Primary' : 'Tertiary'}
            typography="caption2"
            isUppercase={false}
            role="radio"
            aria-checked={isSelected}
            aria-label={name}
          >
            {icon}
            {name}
          </WaymarkButton>
        );
      })}
    </div>
  );
}
