import SearchBar from 'shared/components/SearchBar';
import { WaymarkButton } from 'shared/components/WaymarkButton';
import {
  useIsSearchInProgress,
  useStockImageSearchQuery,
  useSubmitSearchImages,
} from './state/stockImageSearchStore';

import * as styles from './StockImageSearchBar.css';

export function StockImageSearchBar() {
  const [searchQuery, setSearchQuery] = useStockImageSearchQuery();

  const submitSearchImages = useSubmitSearchImages();

  const isSearchInProgress = useIsSearchInProgress();

  return (
    <form
      className={styles.SearchForm}
      onSubmit={(event) => {
        event.preventDefault();

        if (!isSearchInProgress) {
          submitSearchImages();
        }
      }}
    >
      <SearchBar
        className={styles.SearchInput}
        value={searchQuery || ''}
        onChange={(value) => setSearchQuery(value)}
        clearSearch={() => setSearchQuery('')}
      />
      <WaymarkButton
        isLoading={isSearchInProgress}
        isDisabled={!searchQuery}
        type="submit"
        colorTheme="Primary"
      >
        Search
      </WaymarkButton>
    </form>
  );
}
