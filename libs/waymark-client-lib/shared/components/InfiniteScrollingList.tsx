// Vendor
import { useRef, useState, useEffect, useLayoutEffect, type ReactNode } from 'react';

// Local
import { makeIntersectionObserver, useIsElementInViewport } from 'app/hooks/element';
import { scrollToPosition } from 'shared/utils/dom.js';

import * as styles from './InfiniteScrollingList.css';

export const loadTriggerIntersectionObserver = makeIntersectionObserver({
  // Start loading more items if the trigger comes within the
  // viewport's full height from the bottom of the viewport
  rootMargin: '100%',
});

/**
 * Renders an element that will trigger loading another batch of list items if the user
 * scrolls close enough to indicate that they are near the bottom of their currently loaded list items
 * and need more.
 *
 * @param {func}  loadMore  Loads an additional batch of items to display in the list
 */
const InfiniteScrollLoadTrigger = ({
  loadMore,
  children,
}: {
  loadMore: () => Promise<unknown>;
  children: ReactNode;
}) => {
  const triggerElementRef = useRef<HTMLDivElement>(null);

  // Watch whether the element is within 40% of the viewport; when it is, we will trigger loading more list items!
  const isInView = useIsElementInViewport(triggerElementRef, loadTriggerIntersectionObserver);

  // Keep track of whether we are currently fetching so we can limit
  // ourselves to loading one batch at a time
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    // If the trigger element is in view and we aren't currently in the process of fetching anything,
    // let's load some more!
    if (isInView && !isFetching) {
      (async () => {
        // Mark that we are now fetching another batch
        setIsFetching(true);

        try {
          await loadMore();
        } catch (error) {
          console.error(
            'Something went wrong while attempting to load more items in infinite scrolling list',
            error,
          );
        }

        // Update that we are no longer fetching if the promise resolves or rejects
        setTimeout(() => {
          // Waiting for 200ms before we perform this update as a safeguard against double-loading
          // so we can give isInView a chance to update
          setIsFetching(false);
        }, 200);
      })();
    }
  }, [isInView, isFetching, loadMore]);

  return (
    <div
      ref={triggerElementRef}
      className={styles.InfiniteScrollTrigger}
      data-testid="infinite-scroll-trigger"
    >
      {children}
    </div>
  );
};

/**
 * Renders a list of items which will infinitely load more as the user scrolls down
 *
 * @param {Array}   loadedListData  Array of currently loaded data that we can display in the list
 * @param {number}  totalItemCount  The total number of available items that are available to be loaded before we run out
 * @param {func}    renderListItem  Callback function passed to loadedListData.map() to render content for each item in the loadedListData array
 * @param {func}    loadMore        Callback function loads an additional batch of items for the list
 *                                    NOTE: THIS SHOULD RETURN A PROMISE THAT RESOLVES WHEN THE BATCH OF DATA FINISHES LOADING
 * @param {Node}  loadingIndicator  Optional loading state contents to display inside the load trigger element (ie, a loading spinner)
 */
export default function InfiniteScrollingList<T extends object>({
  loadedListData,
  totalItemCount,
  renderListItem,
  loadMore,
  loadingIndicator = null,
  listElement: ListElement = 'div',
  className = '',
  ...props
}: {
  loadedListData: T[];
  totalItemCount: number;
  renderListItem: (item: T, index: number) => ReactNode;
  loadMore: () => Promise<unknown>;
  loadingIndicator?: ReactNode;
  listElement?: keyof JSX.IntrinsicElements;
  className?: string;
  'data-testid'?: string;
}) {
  /**
   * Use an effect to prevent weird scroll position jumps as the list changes/grows.
   * This is necessary because sometimes browsers will try to maintain your scroll position relative
   * to the bottom of the page rather than the top if you're scrolled down far enough. This behavior causes
   * an undesired state where the infinite scroll loading trigger will essentially get stuck in your viewport
   * because newly loaded content doesn't push it down out of view, so it will just endlessly load new variants until it runs out.
   *
   * To prevent this, we'll get the window's scroll position right before the new render gets committed, and then
   * use the useLayoutEffect hook to check what the scroll position is after all changes from the render have
   * been committed to the DOM. If the render caused the scroll position to increase, we will
   * restore to the previous scroll position.
   */
  const scrollPositionBeforeRender = window.scrollY;

  useLayoutEffect(() => {
    const scrollPositionAfterRender = window.scrollY;

    // If the scroll position increased as a result of the render, restore to the previous scroll position
    if (scrollPositionAfterRender > scrollPositionBeforeRender) {
      scrollToPosition(scrollPositionBeforeRender);
    }
  });

  const hasMore = loadedListData.length < totalItemCount;

  return (
    <>
      <ListElement className={className} {...props}>
        {loadedListData.map(renderListItem)}
      </ListElement>
      {hasMore ? (
        // If we haven't loaded all possible items, render an element which will trigger
        // loading another batch if the user scrolls it close enough to the viewport
        <InfiniteScrollLoadTrigger loadMore={loadMore}>
          {loadingIndicator}
        </InfiniteScrollLoadTrigger>
      ) : null}
    </>
  );
}
