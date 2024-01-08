// Vendor
import { useEffect, useRef } from 'react';
import Fuse from 'fuse.js';

// Local
import GoogleAnalyticsService from 'app/services/GoogleAnalyticsService.js';
import SearchBar, { SearchBarProps } from 'shared/components/SearchBar';
import useThrottle from 'shared/hooks/useThrottle';
import useDebounce from 'shared/hooks/useDebounce';

export interface FuzzySearchBarProps<TSearchItem> extends SearchBarProps {
  /**
   * The current value of the search bar (this is required because this has to be a controlled component)
   */
  value: string;
  /**
   * Callback fired when the user changes the search bar's value (this should update the state which is being passed to the value prop.
   * Note that this is distinct from the onUpdateSearch callback which is fired when the fuzzy search results are updated; onUpdateSearch is throttled
   * for performance purposes, but onChange is not)
   */
  onChange: (newValue: string) => void;
  /**
   * Callback which will clear the search input value when the the search bar's clear button is clicked.
   * If this is not provided, the clear button will not be shown.
   */
  clearSearch?: () => void;
  /**
   * Array of all of the items which we will search from
   */
  searchItems: Array<TSearchItem>;
  /**
   * String or array of strings for all keys that we should search against
   * on each object in the searchItems array
   */
  searchKey: string | Array<string>;
  /**
   * The Fuse threshold from 0-1 for how strictly the search string needs to match a key.
   * 0 requires a perfect match and 1 matches everything; Our default of 0.2 generally gets decent results,
   * but you can tweak this if you aren't happy with the results you're getting.
   */
  searchThreshold?: number;
  /**
   * Callback receives the new array of options matching the search query
   * that the user has typed into the search bar
   */
  onUpdateSearch: (searchResults: Array<TSearchItem> | null) => void;
  /**
   * The name of the action to log to google analytics as the user
   * types into the search bar
   */
  searchAnalyticsActionName?: string | null;
}

/**
 * Search bar for performing a fuzzy search on a list of objects.
 * Like SearchBar, this needs to be a controlled component.
 */
export default function FuzzySearchBar<TSearchItem>({
  value,
  onChange,
  clearSearch = undefined,
  searchItems,
  searchKey,
  searchThreshold = 0.2,
  onUpdateSearch,
  searchAnalyticsActionName = null,
  className = undefined,
}: FuzzySearchBarProps<TSearchItem>) {
  const fuseSearchRef = useRef<Fuse<TSearchItem>>();
  const previousSearchKey = useRef<string | Array<string>>(searchKey);
  const previousSearchThreshold = useRef<number>(searchThreshold);
  const previousSearchItems = useRef<Array<TSearchItem>>(searchItems);

  // Effect sets up a Fuse object which will allow us to search our array of searchItems
  // by whatever property we have defined in the searchKey prop.
  // The effect will re-create the Fuse object every time the key or threshold options change.
  useEffect(() => {
    if (
      fuseSearchRef.current &&
      previousSearchKey.current === searchKey &&
      previousSearchThreshold.current === searchThreshold
    ) {
      // If the only thing that has changed is the search items,
      // let's just update the existing Fuse object with the new items
      if (previousSearchItems.current !== searchItems) {
        previousSearchItems.current = searchItems;
        fuseSearchRef.current.setCollection(searchItems);
      }
      return;
    }

    previousSearchKey.current = searchKey;
    previousSearchThreshold.current = searchThreshold;
    previousSearchItems.current = searchItems;

    // If we haven't created a Fuse search object yet or the search key or threshold has changed,
    // we need to create a new Fuse object
    fuseSearchRef.current = new Fuse(searchItems, {
      keys: Array.isArray(searchKey) ? searchKey : [searchKey],
      threshold: searchThreshold,
      // The search string can match any part of the text being searched
      ignoreLocation: true,
    });
  }, [searchThreshold, searchKey, searchItems]);

  // Throttle our handling as the search term changes to avoid performing a ton of expensive search operations
  const throttledOnChange = useThrottle((newSearchString: string) => {
    if (!newSearchString) {
      // If we don't have a term to filter on, just use the full array of options
      onUpdateSearch(null);
      return;
    }

    // Use Fuse to perform a fuzzy search by the search key(s) on all of our items
    const fuzzySearchResults = fuseSearchRef.current?.search(newSearchString);

    // Fuse returns an array of objects in the format { item: yourItem, refIndex: 1, score: 0.6 }
    // so let's just flatten it back into an array of FilterOption objects.
    // The array is sorted by score so the best matches should come first.
    onUpdateSearch(fuzzySearchResults?.map(({ item }) => item) ?? null);
  }, 200);

  // Debounce our analytics logging to avoid spamming GA with a ton of events as the user types
  const debouncedOnChange = useDebounce(
    searchAnalyticsActionName
      ? (newSearchString) => {
          if (newSearchString) {
            GoogleAnalyticsService.trackEvent(searchAnalyticsActionName, {
              eventLabel: newSearchString,
            });
          }
        }
      : null,
    1000,
  );

  // Trigger our throttled and debounced onChange handlers from an effect instead of directly in the
  // SearchBar component's onChange handler so that we can react to external changes to the `value` prop
  // as well as changes from the user typing (ie, if the search bar is cleared by the parent component, we need to update
  // the search results accordingly)
  useEffect(() => {
    throttledOnChange(value);
    debouncedOnChange?.(value);
  }, [debouncedOnChange, throttledOnChange, value]);

  return (
    <SearchBar
      value={value}
      onChange={onChange}
      clearSearch={clearSearch}
      // If we should log searches to analytics, we want to debounce the logging by 1s
      // to ensure we don't spam logging things until the user is done typing
      className={className}
    />
  );
}
