import { useEffect } from 'react';

import AccountImageLibrary from 'app/models/imageLibraries/AccountImageLibrary';
import BusinessImageLibrary from 'app/models/imageLibraries/BusinessImageLibrary';

import FadeSwitchTransition from 'shared/components/FadeSwitchTransition';
import { ImageLibraryImage } from 'shared/api/graphql/imageLibraries/fragments';

import { StockImageSearchBar } from './StockImageSearchBar';
import AspectRatioFilterBar from './AspectRatioFilterBar';
import * as styles from './StockImageView.css';
import CategoriesList from './CategoriesList';
import { useImages, useReset } from './state/stockImageSearchStore';
import { StockImageSearchResultList } from './StockImageSearchResultList';

interface StockImageViewProps {
  onAddToLibrary?: (image: ImageLibraryImage) => void;
  imageLibrary: AccountImageLibrary | BusinessImageLibrary;
}

export function StockImageView({ onAddToLibrary, imageLibrary }: StockImageViewProps) {
  const searchImages = useImages();

  const hasActiveSearch = Boolean(searchImages);

  const resetStockImageSearch = useReset();

  useEffect(() => {
    return () => {
      // Reset any active search when the component unmounts
      resetStockImageSearch();
    };
  }, [resetStockImageSearch]);

  return (
    <div>
      <StockImageSearchBar />
      <AspectRatioFilterBar />
      <hr className={styles.DividingLine} />
      <FadeSwitchTransition transitionKey={hasActiveSearch ? 'search_results' : 'categories'}>
        {hasActiveSearch && searchImages ? (
          <StockImageSearchResultList
            images={searchImages}
            imageLibrary={imageLibrary}
            onAddToLibrary={onAddToLibrary}
          />
        ) : (
          <CategoriesList />
        )}
      </FadeSwitchTransition>
    </div>
  );
}
