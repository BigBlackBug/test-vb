// Vendor
import _ from 'lodash';
import {
    useEffect,
    useRef,
    useState,
    useCallback
} from 'react';
import PropTypes from 'prop-types';
import {
    css,
    cx as emotionClassNames
} from '@emotion/css';

// Shared
import {
    getPointerPositionFromEvent
} from 'shared/utils/dom.js';
import {
    convertRange,
    clamp,
    toPrecision
} from 'shared/utils/math.js';

// Styles
import {
    whiteColor
} from 'styles/themes/waymark/colors.js';

// The focal point has a radius of 24px
const FOCAL_POINT_WIDTH = 24;
const HALF_FOCAL_POINT_WIDTH = 12;

const FOCAL_POINT_DATA_PRECISION_LEVEL = 4;

// Sanitize focal point position data to ensure everything is properly clamped within the bounds of the container
// and limited to a precision level of 4 decimal places
const sanitizeFocalPointPositionData = (focalPointData) => ({
    x: toPrecision(clamp(focalPointData.x, 0, 1), FOCAL_POINT_DATA_PRECISION_LEVEL),
    y: toPrecision(clamp(focalPointData.y, 0, 1), FOCAL_POINT_DATA_PRECISION_LEVEL),
});

/**
 * Renders a focal point selector UI overlay
 *
 * @param {object}  [externalFocalPointPosition] - Controlled focal point data value to initialize the focal point selector with
 *                                                  If none provided, will default to centered (0.5, 0.5) coordinates
 * @param {func}    onChangeFocalPoint - Callback fired when the focal point data is changed
 * @param {number}  [onChangeDebounceTime=100] - Time in milliseconds to debounce onChangeFocalPoint events by
 */
export default function FocalPointSelector({
    externalFocalPointPosition,
    onChangeFocalPoint,
    onChangeDebounceTime,
}) {
    const focalPointSelectorContainerRef = useRef();
    const focalPointElementRef = useRef();

    const [focalPointPosition, setFocalPointPosition] = useState(() =>
        sanitizeFocalPointPositionData(externalFocalPointPosition),
    );

    // Keep a ref to the previous crop data value
    const previousFocalPointPositionRef = useRef(focalPointPosition);

    // Debounce our onChange events to prevent trying to do too many updates too quickly
    const debouncedOnChangeFocalPoint = useCallback(
        _.debounce((newFocalPoint) => onChangeFocalPoint(newFocalPoint), onChangeDebounceTime), [onChangeFocalPoint, onChangeDebounceTime],
    );

    // Every time the debounced onChange function changes, make sure we finish running any pending calls to the previous version first
    useEffect(() => () => debouncedOnChangeFocalPoint.flush(), [debouncedOnChangeFocalPoint]);

    useEffect(() => {
        // If the current focal point changes externally so it no longer matches our previous focal point position,
        // update local state to match it
        const previousFocalPointPosition = previousFocalPointPositionRef.current;

        const sanitizedExternalFocalPoint = sanitizeFocalPointPositionData(externalFocalPointPosition);

        if (!_.isEqual(sanitizedExternalFocalPoint, previousFocalPointPosition)) {
            setFocalPointPosition(sanitizedExternalFocalPoint);
            // If there were any debounced onChange calls pending, cancel them since we want to respect the new external focal point data instead
            debouncedOnChangeFocalPoint.cancel();
            // Update our ref to this new most recent focal point position
            previousFocalPointPositionRef.current = sanitizedExternalFocalPoint;
        }
    }, [debouncedOnChangeFocalPoint, externalFocalPointPosition]);

    useEffect(() => {
        const previousFocalPointPosition = previousFocalPointPositionRef.current;

        // Check whether the focal point position has changed, and if so,
        // pass it along to the onChangeFocalPoint callback
        if (
            focalPointPosition.x !== previousFocalPointPosition.x ||
            focalPointPosition.y !== previousFocalPointPosition.y
        ) {
            debouncedOnChangeFocalPoint(focalPointPosition);

            // Update our ref to the previous focal point
            previousFocalPointPositionRef.current = focalPointPosition;
        }
    }, [focalPointPosition, debouncedOnChangeFocalPoint]);

    useEffect(() => {
        const containerElement = focalPointSelectorContainerRef.current;
        const focalPointElement = focalPointElementRef.current;

        const getFocalPointPositionFromEvent = (event) => {
            // Get the mouse/touch interaction's position in the client
            const pointerClientPosition = getPointerPositionFromEvent(event);

            const containerBoundingRect = containerElement.getBoundingClientRect();

            // Map the mouse's position relative to the container to 0-1 percentage coordinates of the container's dimensions
            const focalPointX = convertRange(
                pointerClientPosition.x,
                containerBoundingRect.x,
                containerBoundingRect.x + containerBoundingRect.width,
                0,
                1,
            );
            const focalPointY = convertRange(
                pointerClientPosition.y,
                containerBoundingRect.y,
                containerBoundingRect.y + containerBoundingRect.height,
                0,
                1,
            );

            return {
                x: clamp(focalPointX, 0, 1),
                y: clamp(focalPointY, 0, 1),
            };
        };

        const onStartDraggingFocalPoint = (event) => {
            // Set `data-is-dragging` attribute on the focal point element to indicate that we're now dragging
            focalPointElement.setAttribute('data-is-dragging', 'true');

            // Update the focal point position to wherever the user's mouse/touch was
            setFocalPointPosition(sanitizeFocalPointPositionData(getFocalPointPositionFromEvent(event)));
        };

        // On desktop, register a drag when the user clicks anywhere on the container
        containerElement.addEventListener('mousedown', onStartDraggingFocalPoint);
        // On touchscreens, only register a drag if the user touches the current focal point rather than the whole container
        // This allows the user to freely touch the selector anywhere else in order to scroll past without
        // it being registered as a drag
        focalPointElement.addEventListener('touchstart', onStartDraggingFocalPoint);

        const onDragFocalPoint = (event) => {
            // Check if the focal point has `data-is-dragging` set
            if (focalPointElement.dataset.isDragging) {
                // If we're dragging, update the focal point position based on where the user's mouse/touch was
                setFocalPointPosition(
                    sanitizeFocalPointPositionData(getFocalPointPositionFromEvent(event)),
                );
            }
        };

        window.addEventListener('mousemove', onDragFocalPoint, {
            passive: true
        });
        window.addEventListener('touchmove', onDragFocalPoint, {
            passive: true
        });

        const onStopDragging = () => {
            // Remove the `data-is-dragging` attribute to indicate that we're no longer dragging the focal point
            focalPointElement.removeAttribute('data-is-dragging');
        };

        window.addEventListener('mouseup', onStopDragging);
        window.addEventListener('touchend', onStopDragging);

        return () => {
            containerElement.removeEventListener('mousedown', onStartDraggingFocalPoint);
            containerElement.removeEventListener('touchstart', onStartDraggingFocalPoint);
            window.removeEventListener('mousemove', onDragFocalPoint);
            window.removeEventListener('touchmove', onDragFocalPoint);
            window.removeEventListener('mouseup', onStopDragging);
            window.removeEventListener('touchend', onStopDragging);
        };
    }, []);

    return ( <
        div className = {
            css `
        /* Make overlay expand to fill containing element */
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        /* Show crosshair cursor when hovering over the focal point selector */
        cursor: crosshair;
        /* Cut off any portion of the overlay that extends outside of the container */
        overflow: hidden;
        transform: translate3d(0, 0, 0);
        border-radius: 4px;
        z-index: 1;

        user-select: none;
      `
        }
        ref = {
            focalPointSelectorContainerRef
        } >
        <
        div ref = {
            focalPointElementRef
        }
        className = {
            emotionClassNames(
                css `
            position: absolute;
            border-radius: 50%;
            width: ${FOCAL_POINT_WIDTH}px;
            height: ${FOCAL_POINT_WIDTH}px;
            transform: translate(-50%, -50%);
            box-shadow: 0 2px 8px 1px rgba(0, 0, 0, 0.75), 0 3px 3px 0 rgba(0, 0, 0, 0.75);
            border: solid 2px ${whiteColor};
            /* Disable page scrolling when the user is dragging the focal point on touch devices */
            touch-action: none;

            // Clamp the focal point circle's displayed position so that it will stay within the bounds of the container without getting cut off
            // Note that this means there will be small ranges of ~4-8% on each edge where the focal point circle will not be able to fully visually
            // represent the current focal point position. Overall, this is acceptable since focal point controls aren't super precise to begin with,
            // but still a good thing to keep in mind
            top: clamp(
              ${HALF_FOCAL_POINT_WIDTH}px,
              ${100 * focalPointPosition.y}%,
              100% - ${HALF_FOCAL_POINT_WIDTH}px
            );
            left: clamp(
              ${HALF_FOCAL_POINT_WIDTH}px,
              ${100 * focalPointPosition.x}%,
              100% - ${HALF_FOCAL_POINT_WIDTH}px
            );

            ::after {
              content: '';
              width: ${FOCAL_POINT_WIDTH * 2}px;
              height: ${FOCAL_POINT_WIDTH * 2}px;
              left: 50%;
              top: 50%;
              transform: translate(-50%, -50%);
              background-color: rgba(232, 239, 242, 0.35);
              border-radius: 50%;
              position: absolute;
              transition: width 0.15s ease-in-out, height 0.15s ease-in-out;
            }

            &[data-is-dragging] {
              /* While the user is dragging, expand the selector's outer ring a little further for a nice little micro-interaction */
              ::after {
                width: ${FOCAL_POINT_WIDTH * 2.5}px;
                height: ${FOCAL_POINT_WIDTH * 2.5}px;
              }
            }
          `,
            )
        }
        /> <
        /div>
    );
}
FocalPointSelector.propTypes = {
    externalFocalPointPosition: PropTypes.shape({
        x: PropTypes.number,
        y: PropTypes.number
    }),
    onChangeFocalPoint: PropTypes.func.isRequired,
    onChangeDebounceTime: PropTypes.number,
};
FocalPointSelector.defaultProps = {
    onChangeDebounceTime: 100,
    externalFocalPointPosition: {
        x: 0.5,
        y: 0.5
    },
};