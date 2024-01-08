import { useState, useRef } from 'react';
import { Transition, TransitionGroup, TransitionStatus } from 'react-transition-group';

const collapseTransitionConfig: Record<TransitionStatus, React.CSSProperties | null> = {
  entered: {
    overflow: 'visible',
    maxHeight: 'none',
    transitionDuration: '0ms',
  },
  exiting: {
    opacity: 0,
  },
  exited: {
    visibility: 'hidden',
    maxHeight: 0,
    opacity: 0,
  },
  entering: null,
  unmounted: null,
};

interface ListItemTransitionWrapperProps {
  children: React.ReactNode;
  transitionDuration: number;
}

/**
 * Component wraps each list item with a Transition component which handles applying the
 * transition animation to make newly added items expand in and removed items collapse out
 *
 * @param {children}  children  Child contents wrapped by this component
 * @param {number}    transitionDuration    Duration in ms that it should take for the list item to transition in/out
 *
 * The TransitionGroup wrapping this component will also set some additional props, so we should spread all other props onto the Transition component
 */
function ListItemTransitionWrapper({
  children,
  transitionDuration,
  ...props
}: ListItemTransitionWrapperProps) {
  const contentsWrapperRef = useRef<HTMLDivElement>(null);

  const [contentsMaxHeight, setContentsMaxHeight] = useState(0);

  const updateContentsHeight = () => {
    // Make sure we have the most up to date height of the contents so we can animate correctly
    setContentsMaxHeight(contentsWrapperRef?.current?.clientHeight ?? 0);
  };

  return (
    <Transition<undefined>
      timeout={transitionDuration}
      // Update our max height to the contents' height when they're about to animate in or out
      onEnter={updateContentsHeight}
      onExit={updateContentsHeight}
      onExiting={(node) => {
        // When the exit animation starts, set the max height to 0 to collapse
        setContentsMaxHeight(0);
        // Trigger a browser reflow by accessing the node's offset height so that the CSS transition will properly play
        // with an animation between the contents height that was just set last frame and the new contents height of 0
        // that we're setting this frame
        return node.offsetHeight;
      }}
      {...props}
    >
      {(transitionState) => (
        <div
          style={{
            maxHeight: contentsMaxHeight,
            overflow: 'hidden',
            transitionTimingFunction: 'ease-in',
            transitionDuration: `${transitionDuration}ms`,
            ...collapseTransitionConfig[transitionState],
          }}
        >
          <div ref={contentsWrapperRef}>{children}</div>
        </div>
      )}
    </Transition>
  );
}

interface AnimatedCollapseTransitionListProps {
  listItems: any[];
  getKeyForItem: (item: any) => string;
  renderListItem: (item: any) => React.ReactNode;
  transitionDuration?: number;
  className?: string;
}

/**
 * Component renders a list of items, where items will perform a collapse
 * transition animation as they are added/removed
 *
 * @param {Object[]}  listItems             List of objects with data describing each item in the list
 * @param {function}  getKeyForItem         Function takes an item object from the list and returns a unique key representing that item (ie, a guid or slug)
 * @param {function}  renderListItem        Function takes an item object from the list and returns contents to render for that list item
 * @param {number}    transitionDuration    Duration in ms that it should take for a list item to transition in/out
 * @param {string}    className
 */
export default function AnimatedCollapseTransitionList({
  listItems,
  getKeyForItem,
  renderListItem,
  transitionDuration = 200,
  className,
}: AnimatedCollapseTransitionListProps) {
  return (
    <TransitionGroup className={className}>
      {listItems.map((item) => (
        <ListItemTransitionWrapper
          key={getKeyForItem(item)}
          transitionDuration={transitionDuration}
        >
          {renderListItem(item)}
        </ListItemTransitionWrapper>
      ))}
    </TransitionGroup>
  );
}
