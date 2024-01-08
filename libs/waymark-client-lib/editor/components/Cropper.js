// Vendor
import {
    useCallback,
    useEffect,
    useRef,
    useState
} from 'react';
import PropTypes from 'prop-types';
import {
    css
} from '@emotion/css';
import _ from 'lodash';

// Shared
import {
    clamp,
    toPrecision
} from 'shared/utils/math.js';
import {
    getPointerPositionFromEvent
} from 'shared/utils/dom.js';

// Styles
import {
    lightCoolGrayColor
} from 'styles/themes/waymark/colors.js';

// The crop selection's dimensions must be a minimum of 1% of the width x 1% of the height of the cropped content
const CROP_SELECTION_MIN_SIZE = 0.01;

const HANDLES = {
    topLeft: 'topLeft',
    top: 'top',
    topRight: 'topRight',
    right: 'right',
    bottomRight: 'bottomRight',
    bottom: 'bottom',
    bottomLeft: 'bottomLeft',
    left: 'left',
    all: 'all',
};

const baseCropHandleStyle = css `
  background-color: ${lightCoolGrayColor};
  position: absolute;
  transform: translate(-50%, -50%);
`;

// Styles for the crop selection's corner handles
const cornerHandleStyle = css `
  ${baseCropHandleStyle}
  border-radius: 50%;
  width: 18px;
  height: 18px;
`;

// Styles for the "horizontal" crop handles on the top and bottom edges of the crop selection
const horizontalHandleStyle = css `
  ${baseCropHandleStyle}
  width: 24px;
  height: 6px;
  border-radius: 2px;

  cursor: ns-resize;
`;

// Styles for the "vertical" crop handles on the left and right edges of the crop selection
const verticalHandleStyle = css `
  ${baseCropHandleStyle}
  width: 6px;
  height: 24px;
  border-radius: 2px;

  cursor: ew-resize;
`;

const CROP_DATA_PRECISION_LEVEL = 4;

// Sanitize crop data to ensure everything is properly clamped within the bounds of the container
// and limited to a precision level of 4 decimal places
const sanitizeCropData = (cropData) => ({
    x: toPrecision(clamp(cropData.x, 0, 1), CROP_DATA_PRECISION_LEVEL),
    y: toPrecision(clamp(cropData.y, 0, 1), CROP_DATA_PRECISION_LEVEL),
    width: toPrecision(clamp(cropData.width, 0, 1), CROP_DATA_PRECISION_LEVEL),
    height: toPrecision(clamp(cropData.height, 0, 1), CROP_DATA_PRECISION_LEVEL),
});

/**
 * Renders a crop UI overlay over whatever contents are wrapped in this component
 *
 * @param {object}  [externalCropData] - Controlled crop data to initialize the cropper with and to update the cropper to match when it changes externally
 *                                        If none provided, will default to covering the full contents
 * @param {func}    onChangeCropData - Callback fired when the crop data is changed
 * @param {number}  [onChangeDebounceTime=100] - Time in milliseconds to debounce onChangeCropData events by
 */
export default function Cropper({
    externalCropData,
    onChangeCropData,
    onChangeDebounceTime
}) {
    const [cropData, setCropData] = useState(() => sanitizeCropData(externalCropData));

    // Keep a ref to the previous crop data value
    const previousCropDataRef = useRef(cropData);

    // Debounce our onChange events to prevent trying to do too many updates too quickly
    const debouncedOnChangeCropData = useCallback(
        _.debounce((newCropData) => onChangeCropData(newCropData), onChangeDebounceTime), [onChangeCropData, onChangeDebounceTime],
    );

    // Every time the debounced onChange function changes, make sure we finish running any pending calls to the previous version first
    useEffect(() => () => debouncedOnChangeCropData.flush(), [debouncedOnChangeCropData]);

    useEffect(() => {
        const sanitizedExternalCropData = sanitizeCropData(externalCropData);
        // If the current crop data changes externally so it no longer matches our state, update to match it
        if (!_.isEqual(sanitizedExternalCropData, previousCropDataRef.current)) {
            setCropData(sanitizedExternalCropData);
            // If there were any debounced onChange calls pending, cancel them since we want to respect the new external crop data instead
            debouncedOnChangeCropData.cancel();

            // Update our ref to the previous crop data
            previousCropDataRef.current = sanitizedExternalCropData;
        }
    }, [debouncedOnChangeCropData, externalCropData]);

    useEffect(() => {
        // Do a deep equality check of whether the crop data has changed, and if so,
        // pass it along to the onChangeCropData callback
        if (!_.isEqual(cropData, previousCropDataRef.current)) {
            debouncedOnChangeCropData(cropData);

            // Update our ref to the previous crop data
            previousCropDataRef.current = cropData;
        }
    }, [cropData, debouncedOnChangeCropData]);

    // Ref to the wrapper element which contains all of our crop UI elements
    const cropperWrapperRef = useRef();

    useEffect(() => {
        let currentDragTarget = null;
        let dragStartMousePosition = null;
        let dragStartCropData = null;

        const cropperWrapperElement = cropperWrapperRef.current;
        const cropHandleElements = Array.from(cropperWrapperElement.querySelectorAll('[data-handle]'));

        const onStartDraggingHandle = (event) => {
            const handleType = event.target.getAttribute('data-handle');
            currentDragTarget = handleType;

            // If the user clicked on one of the handles, stop the event from propagating up to the crop selection element
            if (handleType !== HANDLES.all) event.stopPropagation();

            dragStartMousePosition = getPointerPositionFromEvent(event);
        };

        cropHandleElements.forEach((handleElement) => {
            handleElement.addEventListener('mousedown', onStartDraggingHandle);
            handleElement.addEventListener('touchstart', onStartDraggingHandle);
        });

        const onStopDragging = () => {
            currentDragTarget = null;
            dragStartMousePosition = null;
            dragStartCropData = null;
        };

        window.addEventListener('mouseup', onStopDragging);
        window.addEventListener('touchend', onStopDragging);

        const onMouseMove = (event) => {
            // Don't do anything if there isn't a drag target
            if (!currentDragTarget) return;

            // Get the new mouse position
            const currentMousePosition = getPointerPositionFromEvent(event);

            // If there isn't a drag start position, set it to whatever the current mouse position is
            if (!dragStartMousePosition.current) dragStartMousePosition.current = currentMousePosition;

            const mousePositionDragChangePercentage = {
                x: (currentMousePosition.x - dragStartMousePosition.x) / cropperWrapperElement.clientWidth,
                y: (currentMousePosition.y - dragStartMousePosition.y) / cropperWrapperElement.clientHeight,
            };

            // Update crop data based on how the mouse has moved and what handle is being dragged

            // Rules for top left handle:
            //  - Can move on all axes
            //  - Can't move beyond the bottom-right corner's position
            setCropData((currentCropData) => {
                if (!dragStartCropData) dragStartCropData = currentCropData;

                // Moving the entire selection
                const isDraggingWholeSelection = currentDragTarget === HANDLES.all;

                if (isDraggingWholeSelection) {
                    // Just shift the x and y positions while keeping the width/height the same
                    const currentWidth = currentCropData.width;
                    const currentHeight = currentCropData.height;

                    const newCropData = {
                        x: clamp(
                            dragStartCropData.x + mousePositionDragChangePercentage.x,
                            // the left edge of the selection must stay within the left edge of the content
                            0,
                            // the right edge of the selection must stay within the right edge of the content
                            1 - currentWidth,
                        ),
                        y: clamp(
                            dragStartCropData.y + mousePositionDragChangePercentage.y,
                            // the top edge of the selection must stay within the top edge of the content
                            0,
                            // the bottom edge of the selection must stay within the bottom edge of the content
                            1 - currentHeight,
                        ),
                        width: currentWidth,
                        height: currentHeight,
                    };

                    return sanitizeCropData(newCropData);
                }

                const newCropData = { ...currentCropData
                };

                const isDraggingLeftEdge =
                    currentDragTarget === HANDLES.topLeft ||
                    currentDragTarget === HANDLES.left ||
                    currentDragTarget === HANDLES.bottomLeft;
                const isDraggingRightEdge =
                    currentDragTarget === HANDLES.topRight ||
                    currentDragTarget === HANDLES.right ||
                    currentDragTarget === HANDLES.bottomRight;

                // Moving the left edge of the selection
                if (isDraggingLeftEdge) {
                    // Shift the x position to move the left edge left or right
                    newCropData.x = clamp(
                        dragStartCropData.x + mousePositionDragChangePercentage.x,
                        // the left edge of the selection must stay within the left edge of the content
                        0,
                        // can't move the left edge past the right edge or make the crop selection's width smaller than the minimum
                        dragStartCropData.x + dragStartCropData.width - CROP_SELECTION_MIN_SIZE,
                    );
                    // Modify the crop selection's width to keep the right edge in place relative to the left edge
                    newCropData.width = dragStartCropData.x + dragStartCropData.width - newCropData.x;
                } else if (isDraggingRightEdge) {
                    // Modify the crop selection's width to move the right edge relative to the x position of the left edge
                    newCropData.width = clamp(
                        dragStartCropData.width + mousePositionDragChangePercentage.x,
                        // can't make the crop selection's width smaller than the minimum
                        CROP_SELECTION_MIN_SIZE,
                        // can't make the crop selection so wide that the right edge would go outside of the content
                        1 - newCropData.x,
                    );
                }

                const isDraggingTopEdge =
                    currentDragTarget === HANDLES.topLeft ||
                    currentDragTarget === HANDLES.top ||
                    currentDragTarget === HANDLES.topRight;
                const isDraggingBottomEdge =
                    currentDragTarget === HANDLES.bottomLeft ||
                    currentDragTarget === HANDLES.bottom ||
                    currentDragTarget === HANDLES.bottomRight;

                // Moving the top edge of the selection
                if (isDraggingTopEdge) {
                    // Shift the y position to move the top edge up or down
                    newCropData.y = clamp(
                        dragStartCropData.y + mousePositionDragChangePercentage.y,
                        // the top edge of the selection must stay within the top edge of the content
                        0,
                        // can't move the top edge past the bottom edge or make the crop selection's height smaller than the minimum
                        dragStartCropData.y + dragStartCropData.height - CROP_SELECTION_MIN_SIZE,
                    );
                    // Modify the crop selection's height to keep the bottom edge in place relative to the top edge
                    newCropData.height = dragStartCropData.y + dragStartCropData.height - newCropData.y;
                }
                // Moving the bottom edge of the selection
                else if (isDraggingBottomEdge) {
                    // Modify the crop selection's height to move the bottom edge relative to the y position of the top edge
                    newCropData.height = clamp(
                        dragStartCropData.height + mousePositionDragChangePercentage.y,
                        // can't make the crop selection's height smaller than the minimum
                        CROP_SELECTION_MIN_SIZE,
                        // can't make the crop selection so tall that the bottom edge would go outside of the content
                        1 - newCropData.y,
                    );
                }

                return sanitizeCropData(newCropData);
            });
        };
        window.addEventListener('mousemove', onMouseMove, {
            passive: true
        });
        window.addEventListener('touchmove', onMouseMove, {
            passive: true
        });

        return () => {
            cropHandleElements.forEach((handleElement) => {
                handleElement.removeEventListener('mousedown', onStartDraggingHandle);
                handleElement.removeEventListener('touchstart', onStartDraggingHandle);
            });

            window.removeEventListener('mouseup', onStopDragging);
            window.removeEventListener('touchend', onStopDragging);

            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('touchmove', onMouseMove);
        };
    }, []);

    // Style the selection box to match the crop data's position and dimensions
    const cropSelectionStyle = {
        top: `${cropData.y * 100}%`,
        left: `${cropData.x * 100}%`,
        width: `${cropData.width * 100}%`,
        height: `${cropData.height * 100}%`,
    };

    return ( <
        div ref = {
            cropperWrapperRef
        }
        className = {
            css `
        /* Make the overlay fill whatever element it's placed in */
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        border-radius: 4px;
      `
        } >
        { /* Div for the crop selection */ } <
        div className = {
            css `
          position: absolute;
          cursor: move;
          z-index: 2;

          border: 1px solid ${lightCoolGrayColor};

          /* Disable click+drag highlighting when the user clicks and drags on this element */
          user-select: none;
          /* Disable page scrolling if the user is on a touch device */
          touch-action: none;
        `
        }
        style = {
            cropSelectionStyle
        }
        data - handle = {
            HANDLES.all
        } >
        { /* Top-left handle */ } <
        div className = {
            css `
            ${cornerHandleStyle}
            cursor: nwse-resize;

            top: 0;
            left: 0;
          `
        }
        data - handle = {
            HANDLES.topLeft
        }
        /> { /* Top handle */ } <
        div className = {
            css `
            ${horizontalHandleStyle}

            top: 0;
            left: 50%;
          `
        }
        data - handle = {
            HANDLES.top
        }
        /> { /* Top-right handle */ } <
        div className = {
            css `
            ${cornerHandleStyle}
            cursor: nesw-resize;

            top: 0;
            left: 100%;
          `
        }
        data - handle = {
            HANDLES.topRight
        }
        /> { /* Right handle */ } <
        div className = {
            css `
            ${verticalHandleStyle}

            top: 50%;
            left: 100%;
          `
        }
        data - handle = {
            HANDLES.right
        }
        /> { /* Bottom-right handle */ } <
        div className = {
            css `
            ${cornerHandleStyle}
            cursor: nwse-resize;

            top: 100%;
            left: 100%;
          `
        }
        data - handle = {
            HANDLES.bottomRight
        }
        /> { /* Bottom handle */ } <
        div className = {
            css `
            ${horizontalHandleStyle}

            top: 100%;
            left: 50%;
          `
        }
        data - handle = {
            HANDLES.bottom
        }
        /> { /* Bottom-left handle */ } <
        div className = {
            css `
            ${cornerHandleStyle}
            cursor: nesw-resize;

            top: 100%;
            left: 0;
          `
        }
        data - handle = {
            HANDLES.bottomLeft
        }
        /> { /* Left handle */ } <
        div className = {
            css `
            ${verticalHandleStyle}

            top: 50%;
            left: 0;
          `
        }
        data - handle = {
            HANDLES.left
        }
        /> { /* Vertical "rule of thirds" lines */ } <
        div className = {
            css `
            position: absolute;
            width: 33.3333%;
            height: 100%;
            left: 33.3333%;
            top: 0;
            border-left: 1px solid ${lightCoolGrayColor};
            border-right: 1px solid ${lightCoolGrayColor};
            pointer-events: none;
          `
        }
        /> { /* Horizontal "rule of thirds" lines */ } <
        div className = {
            css `
            position: absolute;
            width: 100%;
            height: 33.3333%;
            top: 33.3333%;
            left: 0;
            border-top: 1px solid ${lightCoolGrayColor};
            border-bottom: 1px solid ${lightCoolGrayColor};
            pointer-events: none;
          `
        }
        /> <
        /div> {
            /* Secondary layer displays a darkened overlay over the portion of the wrapped contents that
                      isn't selected by the cropper */
        } <
        div className = {
            css `
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;

          /* Hide overflow from the child's box shadow */
          overflow: hidden;
          pointer-events: none;
          border-radius: 4px;
        `
        } >
        <
        div className = {
            css `
            position: absolute;
            /* Make a really big box-shadow around the selection to achieve the appearance of a dark overlay with a box cut out of it */
            box-shadow: 0 0 0 999px rgba(0, 0, 0, 0.7);
            z-index: 1;
          `
        }
        // Make the "cutout" match the exact position/dimensions of the crop selection
        style = {
            cropSelectionStyle
        }
        /> <
        /div> <
        /div>
    );
}
Cropper.propTypes = {
    externalCropData: PropTypes.shape({
        x: PropTypes.number,
        y: PropTypes.number,
        width: PropTypes.number,
        height: PropTypes.number,
    }),
    onChangeCropData: PropTypes.func.isRequired,
    onChangeDebounceTime: PropTypes.number,
};
Cropper.defaultProps = {
    externalCropData: {
        x: 0,
        y: 0,
        width: 1,
        height: 1,
    },
    onChangeDebounceTime: 100,
};