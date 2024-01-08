// Vendor
import { useCallback, useRef, useState } from 'react';
import classNames from 'classnames';

// Shared
import { Portal } from '@libs/shared-ui-components';
import useEvent from 'shared/hooks/useEvent';

// Local
import useWindowEvent from 'app/hooks/windowEvent.js';

import * as styles from './PopupLabelWrapper.css';

const LABEL_EDGE_PADDING_AMOUNT_PX = 6;
const TRIANGLE_HEIGHT_PX = 7;

// Defining these outside of the component so we don't have to fight with it
const onWindowScrollEventOptions = { capture: true, passive: true };

interface PopupLabelWrapperProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  labelClassName?: string;
  labelMaxWidth?: number;
  shouldCaptureKeyboardFocus?: boolean;
}

/**
 * Makes the wrapped contents show a black popup label when they're hovered
 *
 * @param {string}      label         The text for the pop up label
 * @param {string}      [className]   Custom class to apply to the button
 * @param {string}      [labelClassName]   Custom class to apply to the label
 * @param {number}      [labelMaxWidth=327]   Max width in px that the label should be displayed at
 * @param {bool}        [shouldCaptureKeyboardFocus=true]   Whether the label should be keyboard focusable; you may want to turn this off
 *                                                            if there are a ton of repeated popup labels on the page to the point where it becomes
 *                                                            disruptive to navigation.
 * @param {React.ReactNode} children      Children to wrap in the button
 * All other params are passed through to the button component
 */
const PopupLabelWrapper = ({
  label,
  className = '',
  labelClassName = '',
  labelMaxWidth = 327,
  shouldCaptureKeyboardFocus = true,
  children,
  ...otherProps
}: PopupLabelWrapperProps) => {
  const labelID = useRef<string>();
  if (!labelID.current) {
    // Generate a unique random ID for the label which we can use to associate it with the wrapper
    // for accessibility
    labelID.current = `popup-label-${Math.random().toString(36).substring(2, 9)}`;
  }

  const popupLabel = useRef<HTMLDivElement>(null);
  const popupTriangle = useRef<HTMLDivElement>(null);
  const popupWrapper = useRef<HTMLDivElement>(null);

  const [isHovering, setIsHovering] = useState(false);
  const [hasFocus, setHasFocus] = useState(false);

  // Update the positioning of the popup label when the user focuses/hovers over the wrapper
  // We're doing this because absolutely positioning the label relative to the wrapper contents gets super janky
  const updateLabelPosition = useEvent(() => {
    if (!popupLabel.current || !popupTriangle.current || !popupWrapper.current) {
      return;
    }

    // Calculate the popup label's max width so that it's capped at the defined max but can go lower if need be to avoid
    // overflowing off particularly small screens
    popupLabel.current.style.maxWidth = `${Math.min(
      window.innerWidth - LABEL_EDGE_PADDING_AMOUNT_PX * 2,
      labelMaxWidth,
    )}px`;

    const wrapperRect = popupWrapper.current.getBoundingClientRect();
    const popupLabelRect = popupLabel.current.getBoundingClientRect();

    const popupLabelWidth = popupLabelRect.width;

    // Position the bottom of the label to be 7px above the top of the wrapper
    let topPosition = wrapperRect.top - popupLabelRect.height - TRIANGLE_HEIGHT_PX;

    if (topPosition < LABEL_EDGE_PADDING_AMOUNT_PX) {
      // If the top position would result in the label going over the top of the screen,
      // place the label underneath the contents instead
      topPosition = wrapperRect.bottom + TRIANGLE_HEIGHT_PX;

      // Place the triangle to be above the label rather than below it like usual
      // TODO: would love to refactor this to use a class or something, just need something to work quickly for now
      popupTriangle.current.style.top = `${-TRIANGLE_HEIGHT_PX * 2}px`;
      popupTriangle.current.style.transform = 'rotate(180deg) translateY(-100%)';
    } else {
      popupTriangle.current.style.top = '';
      popupTriangle.current.style.transform = '';
    }

    // Position the left edge of the label so that it's centered over the wrapper
    const leftPosition = wrapperRect.left + (wrapperRect.width - popupLabelWidth) / 2;

    popupLabel.current.style.top = `${topPosition}px`;
    popupLabel.current.style.left = `${leftPosition}px`;

    // Determine how much we need to offset the label so that it won't overflow off the
    // edge of the screen
    const rightEdgeBasePosition = leftPosition + popupLabelWidth;
    const rightWindowEdge = window.innerWidth - LABEL_EDGE_PADDING_AMOUNT_PX;

    let marginOffsetLeft;

    if (leftPosition < LABEL_EDGE_PADDING_AMOUNT_PX) {
      // Determine the offset needed to place the label's left edge back within page's padded bounds
      marginOffsetLeft = LABEL_EDGE_PADDING_AMOUNT_PX - leftPosition;
    } else if (rightEdgeBasePosition > rightWindowEdge) {
      // Determine the offset needed to place the label's right edge back within page's padded bounds
      marginOffsetLeft = rightWindowEdge - rightEdgeBasePosition;
    } else {
      marginOffsetLeft = 0;
    }

    popupLabel.current.style.marginLeft = `${marginOffsetLeft}px`;
    popupTriangle.current.style.marginLeft = `${-marginOffsetLeft}px`;
  });

  const onMouseEnter = useEvent(() => {
    setIsHovering(true);
    updateLabelPosition();
  });

  const onMouseOut = useEvent((event: React.MouseEvent<HTMLDivElement>) => {
    // The relatedTarget is the element that the mouse is moving to, so check that said target
    // isn't inside the wrapper
    const relatedTarget = event.relatedTarget as HTMLElement;
    if (!popupWrapper.current?.contains(relatedTarget)) {
      setIsHovering(false);
    }
  });

  const onFocus = useEvent(() => {
    setHasFocus(true);
    updateLabelPosition();
  });

  const onBlur = useEvent(() => {
    setHasFocus(false);
  });

  const onKeyUp = useEvent((event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      // Aria guidelines dictate that the popup should be hidden when the user presses escape
      popupWrapper.current?.blur();
    }
  });

  // Make sure label is blurred when the user starts scrolling so things
  // don't start looking unintentionally funky
  useWindowEvent(
    'scroll',
    // Memoizing with useCallback so we don't keep adding/removing the event listener on every render
    useCallback(() => {
      popupWrapper.current?.blur();
    }, []),
    onWindowScrollEventOptions,
  );

  return (
    <>
      <div
        className={classNames(styles.ContentsWrapper, className)}
        onMouseEnter={onMouseEnter}
        onMouseOut={onMouseOut}
        onFocus={onFocus}
        onBlur={onBlur}
        onKeyUp={onKeyUp}
        // Make the wrapper a focusable button so that it can receive focus on mobile when tapped
        role="button"
        tabIndex={shouldCaptureKeyboardFocus ? 0 : -1}
        ref={popupWrapper}
        aria-describedby={labelID.current}
        {...otherProps}
      >
        <Portal>
          <div
            ref={popupLabel}
            role="tooltip"
            id={labelID.current}
            className={classNames(styles.PopupLabel, labelClassName)}
            {...styles.dataShouldShowPopup(hasFocus || isHovering)}
          >
            {label}
            <div className={styles.PopupTriangle} ref={popupTriangle} />
          </div>
        </Portal>
        {children}
      </div>
    </>
  );
};

export default PopupLabelWrapper;
