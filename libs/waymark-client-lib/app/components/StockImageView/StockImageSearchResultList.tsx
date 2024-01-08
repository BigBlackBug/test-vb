import { Image } from 'libs/media-asset-management-ts';

import InfiniteScrollingList from 'shared/components/InfiniteScrollingList';

import {
  useGetNextPage,
  useIsSearchInProgress,
  useTotalAvailableImageCount,
} from './state/stockImageSearchStore';
import * as styles from './StockImageSearchResultList.css';
import { RotatingLoader } from '@libs/shared-ui-components/src';
import StockImageSearchResultListItem from './StockImageSearchResultListItem';
import AccountImageLibrary from 'app/models/imageLibraries/AccountImageLibrary';
import BusinessImageLibrary from 'app/models/imageLibraries/BusinessImageLibrary';
import { typographyStyleVariants } from '@libs/shared-ui-styles/src';
import FadeSwitchTransition from 'shared/components/FadeSwitchTransition';
import { ImageLibraryImage } from 'shared/api/graphql/imageLibraries/fragments';

interface StockImageSearchResultListProps {
  images: Image[];
  imageLibrary: AccountImageLibrary | BusinessImageLibrary;
  onAddToLibrary?: (image: ImageLibraryImage) => void;
}

export function StockImageSearchResultList({
  images,
  imageLibrary,
  onAddToLibrary,
}: StockImageSearchResultListProps) {
  const totalAvailableImageCount = useTotalAvailableImageCount();
  const isSearchInProgress = useIsSearchInProgress();

  const getNextPage = useGetNextPage();

  const hasNoResults = !isSearchInProgress && images && images.length === 0;

  if (hasNoResults) {
    return (
      <div>
        <h3 className={typographyStyleVariants.title6}>
          We couldn&#39;t find any images for that search.
        </h3>
        <p className={typographyStyleVariants.bodySmall}>
          Try searching for another term, or browse categories.
        </p>
      </div>
    );
  }

  const loadingIndicator = <RotatingLoader className={styles.SearchResultLoadingIndicator} />;

  const isLoadingFirstImages = isSearchInProgress && images.length === 0;

  return (
    <FadeSwitchTransition transitionKey={isLoadingFirstImages ? 'loading' : 'results'}>
      {isLoadingFirstImages ? (
        loadingIndicator
      ) : (
        <InfiniteScrollingList
          className={styles.SearchResultGrid}
          listElement="ul"
          loadedListData={images}
          totalItemCount={totalAvailableImageCount}
          loadMore={getNextPage}
          renderListItem={(image) => (
            <StockImageSearchResultListItem
              key={image.sourceAssetID}
              imageLibrary={imageLibrary}
              image={image}
              onAddToLibrary={onAddToLibrary}
            />
          )}
          loadingIndicator={loadingIndicator}
        />
      )}
    </FadeSwitchTransition>
  );
}
