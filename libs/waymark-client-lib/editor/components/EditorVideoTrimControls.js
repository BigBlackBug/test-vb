// Vendor
import _ from 'lodash';
import {
    useRef,
    useState,
    useCallback,
    useEffect
} from 'react';
import PropTypes from 'prop-types';
import {
    assignInlineVars
} from '@vanilla-extract/dynamic';

// Editor
import TrimControlTimelineCanvas from 'editor/components/TrimControlTimelineCanvas.js';
import EditorVideoTrimDurationWarning from 'editor/components/EditorVideoTrimDurationWarning.js';
import editorPropTypes from 'editor/constants/editorPropTypes.js';
import {
    modificationConfigurationPaths
} from 'editor/constants/EditorVideo.js';

// Shared
import {
    PlayIcon,
    PauseIcon
} from 'shared/components/VideoPlayerIcons';
import {
    toPrecision,
    clamp
} from 'shared/utils/math.js';
import {
    useVideoTemplateConfigurator
} from 'shared/web_video/providers/VideoTemplateConfiguratorProvider';
import useDebounce from 'shared/hooks/useDebounce';

/* WAYMARK APP DEPENDENCIES */
import {
    defaultIconColor
} from 'app/icons/constants';
import {
    usePrevious
} from 'app/hooks/utils.js';
import {
    useIsWindowMobile
} from 'app/hooks/windowBreakpoint.js';
/* END WAYMARK APP DEPENDENCIES */

import * as styles from './EditorVideoTrimControls.css';

const isAudioContextSupported = window.AudioContext !== undefined;

/**
 * Renders controls for trimming the start and end points of the video field's selected video asset
 *
 * @param {EditorVideoField} currentlyEditingVideoField   The video field currently selected for editing which we will be trimming
 * @param {object}           videoAssetMetadata           An object describing helpful metadata for the video asset that we wil be editing
 * @param {object}           currentConfigurationValue    The current data stored in the configuration for this video fields
 * @param {func}             updateVideoConfigurationValue  Updates the video field's configuration value
 * @param {RefObject}        videoElementRef              Ref to a preview video element which the trim playback controls can manipulate
 */
export default function EditorVideoTrimControls({
    currentlyEditingVideoField,
    videoAssetMetadata,
    currentConfigurationValue,
    updateVideoConfigurationValue,
    videoElementRef,
}) {
    const isMobile = useIsWindowMobile();

    const configurator = useVideoTemplateConfigurator();
    const videoFramerate = _.get(configurator, 'renderer.framerate');

    const videoFieldPlaybackDuration =
        (currentlyEditingVideoField.outPoint - currentlyEditingVideoField.inPoint) / videoFramerate;

    const videoAssetDuration = videoAssetMetadata.length;

    // Clips can be extended to 1.25 times longer than the video field's base display duration; we will just speed up the clip by up to 25% to make it fit
    // However, if this browser doesn't support AudioContext, the user will experience audio issues if the video is extended beyond
    // the base duration, so cap the clip duration at the base duration
    const maxClipDuration = videoFieldPlaybackDuration * (isAudioContextSupported ? 1.25 : 1);

    // Determine how many seconds the timeline's base width should represent; if the asset's duration is longer than double the base field duration,
    // we will cap it there and make it so you can "scroll" the timeline to see the rest
    const secondsInTimelineWidth = Math.min(videoAssetDuration, videoFieldPlaybackDuration * 2);

    // Clips can be trimmed down to a minimum of 5% of the timeline's width. This is just a fairly arbitrary number that seems to feel pretty consistently good for various different
    // asset lengths
    const minClipDuration = secondsInTimelineWidth * 0.05;

    const trimSliderControlsRef = useRef();
    const draggableSelectedZoneRef = useRef();
    const currentTimeInputRef = useRef();
    const isInitialLoad = useRef(false);

    // Keep track of whether the preview video is playing
    const [isPlayingPreview, setIsPlayingPreview] = useState(false);

    /**
     * Takes start and end times, clamps and sanitizes them to work with our inputs, and returns them as an object
     * that can be stored in the `trimStartEndTimes` state
     *
     * @param {number}  startTime
     * @param {number}  endTime
     */
    const getSanitizedStartEndTimes = useCallback(
        (newStartTime, newEndTime) => ({
            // Ensure the new times are clamped within the allowed range and rounded to a precision of 2 decimal places
            startTime: toPrecision(clamp(newStartTime, 0, videoAssetDuration), 2),
            endTime: toPrecision(clamp(newEndTime, 0, videoAssetDuration), 2),
        }), [videoAssetDuration],
    );

    // If we have an initial start time from the configuration, set the start point to that; otherwise, default to 0, the start of the asset
    const configurationTrimStartTime = _.get(
        currentConfigurationValue,
        modificationConfigurationPaths.trim.startTime,
        0,
    );
    const configurationTrimDuration = _.get(
        currentConfigurationValue,
        modificationConfigurationPaths.trim.duration,
        // Make our duration default to fill the field's full playback duration, or set it to the end
        // of the asset if it's shorter than the field's duration
        Math.min(videoFieldPlaybackDuration, videoAssetDuration - configurationTrimStartTime),
    );

    // Keep track of the selected start and end times for our clip
    // We're keeping them together in the same state object so that we can update them together without triggering extra unnecessary re-renders
    const [trimStartEndTimes, setTrimStartEndTimes] = useState(() =>
        getSanitizedStartEndTimes(
            configurationTrimStartTime,
            configurationTrimStartTime + configurationTrimDuration,
        ),
    );
    const previousTrimStartEndTimes = usePrevious(trimStartEndTimes);

    const {
        startTime: trimStartTime,
        endTime: trimEndTime
    } = trimStartEndTimes;

    const trimDuration = trimEndTime - trimStartTime;

    // The time in seconds on the timeline that we should shift the timeline's left edge to (only applicable for long assets where timeline has overflow)
    const [timelineScrollTime, setTimelineScrollTime] = useState(0);

    /**
     * Updates the trim values stored in the configuration, with a 100ms debounce applied to prevent performance issues
     * when the trim times are being repeatedly changed very rapidly
     * We're memoizing this so that we can cancel calls to it necessary
     *
     * @param {number}  startTime   New start time to use for the configuration's start time
     * @param {number}  endTime     New end time to use for calculating the duration to store in the configuration
     */
    const debouncedUpdateTrimConfigurationValues = useDebounce((startTime, endTime) => {
        const contentTrimDuration = endTime - startTime;

        // Set contentPlaybackDuration to the same value as contentTrimDuration (in frames) if the clip is shorter
        // than the default clip so it holds on the last frame. But if if the clip is longer than (or the same length)
        // the default clip length, leave it as the default so the clip is sped up to fit in the spot.
        const contentPlaybackDuration =
            contentTrimDuration < videoFieldPlaybackDuration ?
            contentTrimDuration * videoFramerate :
            videoFieldPlaybackDuration * videoFramerate;

        updateVideoConfigurationValue((currentVideoConfigurationValue) => {
            return {
                ...currentVideoConfigurationValue,
                [modificationConfigurationPaths.trim.startTime]: startTime,
                [modificationConfigurationPaths.trim.duration]: contentTrimDuration,
                [modificationConfigurationPaths.playbackDuration]: contentPlaybackDuration,
            };
        });
    }, 100);

    useEffect(() => {
        // We do not want to update the configuration when the panel is initially opened because it pauses the timeline.
        if (!isInitialLoad.current) {
            isInitialLoad.current = true;
            return;
        }

        // When the trim times change in our local component state, make a debounced call to update the configuration to reflect this change
        debouncedUpdateTrimConfigurationValues(trimStartTime, trimEndTime);
    }, [debouncedUpdateTrimConfigurationValues, trimEndTime, trimStartTime]);

    useEffect(
        () => {
            // If the trim values in the configuration change in a way that causes them to no longer match our component's state,
            // that likely means the values were changed externally and we're now out of sync, so we should
            // update our component state to reflect the configuration's new values.
            // This allows us to keep this as a semi-controlled input where the UI can get de-synced from the configuration while
            // our changes are being debounced, but we can still stay in sync if the configuration value is changed
            // by something external from the trim controls (ie, the default reset button)
            const sanitizedConfigurationStartEndTimes = getSanitizedStartEndTimes(
                configurationTrimStartTime,
                configurationTrimStartTime + configurationTrimDuration,
            );

            if (!_.isEqual(sanitizedConfigurationStartEndTimes, trimStartEndTimes)) {
                setTrimStartEndTimes(sanitizedConfigurationStartEndTimes);

                if (debouncedUpdateTrimConfigurationValues) {
                    // If there was a debounced update in progress, cancel it
                    debouncedUpdateTrimConfigurationValues.cancel();
                }
            }
        },
        // We only want to run this effect when the configuration values change
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [configurationTrimStartTime, configurationTrimDuration],
    );

    useEffect(
        () => () => {
            // Set up a cleanup function which will clear and immediately invoke the last call to the
            // debounced configuration update function so that we can guarantee it will be safely called before the
            // component unmounts
            debouncedUpdateTrimConfigurationValues.flush();
        }, [debouncedUpdateTrimConfigurationValues],
    );

    const pauseVideo = useCallback(() => {
        const videoElement = videoElementRef.current;

        // Pause the preview video
        setIsPlayingPreview(false);
        videoElement.pause();
    }, [videoElementRef]);

    const playVideo = async () => {
        const videoElement = videoElementRef.current;

        // Mark that the preview video is now playing
        setIsPlayingPreview(true);

        // Ensure the renderer is paused so the two don't play at the same time
        await configurator.stop();

        // Set the video element's current time to wherever the time indicator bar currently is
        let playbackStartTime = currentTimeInputRef.current.value || 0;

        if (playbackStartTime >= trimEndTime) {
            // If the playback time is at or past the end of our trim selection, jump back to 0.5 seconds
            // before the end
            // If the trim selection is shorter than 0.5 seconds, just play from the start of the selection
            playbackStartTime = Math.max(trimEndTime - 0.5, trimStartTime);
        } else if (playbackStartTime < trimStartTime) {
            // If the playback time is before the start of the trim selection, play from the start of the selection
            playbackStartTime = trimStartTime;
        }

        // Set the video to the whatever time we determined we should start playback from
        videoElement.currentTime = playbackStartTime;

        // Clear out any pending onseeked callbacks
        videoElement.onseeked = null;

        // Play the video!
        videoElement.play();
    };

    // Toggle between play/pause states
    const onTogglePlayback = () => {
        if (isPlayingPreview) {
            pauseVideo();
        } else {
            playVideo();
        }
    };

    // Effect sets up an update loop with requestAnimationFrame to keep track of the video's current time
    // while it's playing and performs any necessary effects based on that time
    useEffect(() => {
        if (!isPlayingPreview) {
            // Don't do anything anything if the video is not playing
            return undefined;
        }

        const videoElement = videoElementRef.current;
        const currentTimeInput = currentTimeInputRef.current;

        let animationFrameId = null;

        // Set up an update loop that checks the video player's time each frame and jumps it back around to the start of the clip
        // when it reaches the end
        // We're implementing this with requestAnimationFrame rather than the video's onTimeUpdate event because that only fires every .25 seconds
        // in chrome and safari which just isn't frequent enough for the accuracy that we need
        const checkCurrentVideoTime = () => {
            // Run this check again next frame until the loop gets cancelled
            animationFrameId = requestAnimationFrame(checkCurrentVideoTime);

            if (configurator.isPlaying()) {
                // If the configurator video starts playing, we shuld pause the trim video playback
                pauseVideo();
            }

            if (
                isPlayingPreview &&
                (videoElement.currentTime < trimStartTime || videoElement.currentTime >= trimEndTime)
            ) {
                // If the video is playing and the current time is outside of the bounds of our trim selection,
                // jump back to the start of the trim selection
                videoElement.currentTime = trimStartTime;
            }

            // Update the time indicator bar's position to reflect the current time in the video preview's playback
            // Doing this here rather than as a `value` property so that we can avoid re-rendering the entire component
            // every frame just to update the styling for one small input
            currentTimeInput.value = videoElement.currentTime;
        };

        // Kick off the animation frame loop
        animationFrameId = requestAnimationFrame(checkCurrentVideoTime);

        // Cancel the animation frame loop on cleanup
        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [
        trimEndTime,
        trimStartTime,
        isPlayingPreview,
        trimDuration,
        configurator,
        videoElementRef,
        pauseVideo,
    ]);

    /**
     * Seek the video to a new time, with throttling applied so that we don't overwhelm the video player by trying
     * to repeatedly change the time before it can finish seeking to any given frame
     * Memoizing with useCallback so that we can use this function in the effect below
     *
     * @param {number}  newTime   The new time in seconds that we want to seek the video to
     */
    const throttledSetVideoTime = useCallback(
        (newTime) => {
            const videoElement = videoElementRef.current;

            const seekToTime = () => {
                videoElement.onseeked = null;
                videoElement.currentTime = newTime;
            };

            if (videoElement.seeking) {
                // If the video is currently seeking, wait to jump it to the new desired time until it's done seeking.
                // By directly setting it like this, we can guarantee a sort of throttle effect where once the `seeked` event fires,
                // it will only use the most recent callback that was set, therefore setting it to the most recent desired time.
                // Doing this helps improve the user experience a lot because otherwise the video element can become overwhelmed if its time is getting changed
                // too frequently, meaning it will never have enough time to display any one frame at all as the player is scrubbing.
                videoElement.onseeked = seekToTime;
            } else {
                // If the video isn't seeking, just go for it
                seekToTime();
            }
        }, [videoElementRef],
    );

    // Effect updates the time that the video preview should be displaying as our selected trim start and end times change
    useEffect(() => {
        // Don't do anything if we don't have a previous time as a reference point or the video preview is currently playing
        if (!previousTrimStartEndTimes || isPlayingPreview) {
            return;
        }

        const videoElement = videoElementRef.current;

        // On certain mobile devices (iOS) you can't set videoElement.currentTime until after it has loaded
        // some video data, so ensure we manually force the video to start loading
        if (
            isMobile &&
            // If the video's ready state is less than HAVE_CURRENT_DATA, we can't set the time
            // in iOS Safari
            videoElement.readyState < 2
        ) {
            videoElement.load();
        }

        if (trimStartTime !== previousTrimStartEndTimes.startTime) {
            // If the start time changed or both times changed together, set the video to display the new start time
            throttledSetVideoTime(trimStartTime);
        } else if (trimEndTime !== previousTrimStartEndTimes.endTime) {
            // If the end time changed, set the video to display the new end time
            throttledSetVideoTime(trimEndTime);
        }
    }, [
        isMobile,
        isPlayingPreview,
        previousTrimStartEndTimes,
        throttledSetVideoTime,
        trimEndTime,
        trimStartTime,
        videoElementRef,
    ]);

    // Effect sets up event handling for clicking+dragging on the zone in between the start and end points to shift the entire trim selection
    useEffect(() => {
        // Keep track of the latest X position of the mouse while the user is dragging
        let currentMousePositionX = null;
        // Keep track of the last recorded mouse position as a percentage relative to the trim timeline's position and width so we can
        // compare how the mouses' position relative to the timeline has changed since the last frame
        // This is more helpful than a raw clientX position because if the last mouse position caused the timeline to scroll,
        // the mouse position's percentage relative to the timeline can change even if the user hasn't moved their mouse.
        // This allows us to achieve the effect of making the timeline continue scrolling if you drag and hold the trim scrubber on the edge!
        let lastMousePositionTimelinePercentage = null;

        let isMouseDown = false;
        let isDragging = false;
        let updateAnimationFrameId = null;

        // While we're dragging, use an animation loop to continuously check how the user's mouse position has changed relative to the timeline.
        // Doing this in an event loop rather than watching for mouse events allows us to do things like make the timeline continue scrolling while
        // the user is holding the trim scrubber on the edge of the timeline.
        const checkDragPositionUpdate = () => {
            // Request that we call this update loop again next frame and store the id so we can cancel it if need be
            updateAnimationFrameId = requestAnimationFrame(checkDragPositionUpdate);

            const timelineBounds = trimSliderControlsRef.current.getBoundingClientRect();

            // Get the current mouse position as a position relative to the width of the timeline
            const currentMousePositionPercentage =
                (currentMousePositionX - timelineBounds.left) / timelineBounds.width;

            let timeShiftAmount = 0;

            if (lastMousePositionTimelinePercentage !== null) {
                // Subtract the percentages and multiply by the asset's duration to translate the percentage into how much time that change represents in the video
                timeShiftAmount =
                    (currentMousePositionPercentage - lastMousePositionTimelinePercentage) *
                    videoAssetDuration;
            }

            // Store the current mouse percentage as our previous percentage so we can compare next frame
            lastMousePositionTimelinePercentage = currentMousePositionPercentage;

            if (timeShiftAmount !== 0) {
                setTrimStartEndTimes(({
                    startTime,
                    endTime
                }) => {
                    const clipDuration = endTime - startTime;

                    let newClipStartTime = startTime + timeShiftAmount;
                    let newClipEndTime = endTime + timeShiftAmount;

                    // Ensure we keep our new start + end times clamped within the video's duration
                    if (newClipStartTime < 0) {
                        newClipStartTime = 0;
                        newClipEndTime = clipDuration;
                    } else if (newClipEndTime > videoAssetDuration) {
                        newClipEndTime = videoAssetDuration;
                        newClipStartTime = newClipEndTime - clipDuration;
                    }

                    return getSanitizedStartEndTimes(newClipStartTime, newClipEndTime);
                });
            }
        };

        const updateCurrentMousePosition = (event) => {
            // Get the current mouse/touch position from this event
            let {
                clientX
            } = event;

            if (clientX == null) {
                // If the event didn't have a `clientX` value, it's probably a touch event so let's try to get the touch position
                if (event.touches && event.touches.length > 0) {
                    // eslint-disable-next-line prefer-destructuring
                    ({
                        clientX
                    } = event.touches[0]);
                } else if (event.changedTouches && event.changedTouches.length > 0) {
                    // eslint-disable-next-line prefer-destructuring
                    ({
                        clientX
                    } = event.changedTouches[0]);
                } else {
                    clientX = 0;
                }
            }

            // Store our new current mouse position
            currentMousePositionX = clientX;
        };

        const onDrag = (event) => {
            if (isMouseDown && !isDragging) {
                // If the user is still holding their mouse down after clicking on the draggable zone and they just moved
                // their mouse, indicate that they are dragging and kick off an animation loop to start watching for
                // drag position updates
                isDragging = true;
                updateAnimationFrameId = requestAnimationFrame(checkDragPositionUpdate);
            }

            if (isDragging) {
                // If we're currently dragging, update the current mouse position to reflect the new change since it was just moved
                updateCurrentMousePosition(event);
            }
        };

        const onStartDragging = (event) => {
            if (!isMouseDown) {
                //  Update our drag state values to indicate that the user has clicked on the draggable selected zone
                isMouseDown = true;
                updateCurrentMousePosition(event);

                // Store our initial mouse position relative to the width of the timeline so we can
                // check against it when the user starts moving the mouse
                const timelineBounds = trimSliderControlsRef.current.getBoundingClientRect();
                lastMousePositionTimelinePercentage =
                    (currentMousePositionX - timelineBounds.left) / timelineBounds.width;
            }
        };

        const onStopDragging = () => {
            if (isMouseDown && !isDragging) {
                // If the user clicked on the draggable selected zone but didn't drag at all, let's jump the video
                // to the time on the timeline where they clicked
                const timelineBounds = trimSliderControlsRef.current.getBoundingClientRect();

                // Get the current mouse position as a percentage relative to the width of the timeline
                const currentMousePositionPercentage =
                    (currentMousePositionX - timelineBounds.left) / timelineBounds.width;

                // Set the video time to where the user clicked on the timeline and update the time indicator to reflect that
                const newTime = currentMousePositionPercentage * videoAssetDuration;
                throttledSetVideoTime(newTime);
                currentTimeInputRef.current.value = `${newTime}`;
            }

            // Reset our dragging variables to indicate we're no longer dragging
            isMouseDown = false;
            isDragging = false;
            currentMousePositionX = null;
            lastMousePositionTimelinePercentage = null;

            // Cancel our update loop
            cancelAnimationFrame(updateAnimationFrameId);
        };

        // Add all of our event listeners
        const draggableSelectedZone = draggableSelectedZoneRef.current;

        draggableSelectedZone.addEventListener('mousedown', onStartDragging, {
            passive: true
        });
        draggableSelectedZone.addEventListener('touchstart', onStartDragging, {
            passive: true
        });

        window.addEventListener('mousemove', onDrag, {
            passive: true
        });
        window.addEventListener('touchmove', onDrag, {
            passive: true
        });

        window.addEventListener('mouseup', onStopDragging, {
            passive: true
        });
        window.addEventListener('touchend', onStopDragging, {
            passive: true
        });

        return () => {
            // Clean up all event listeners
            draggableSelectedZone.removeEventListener('mousedown', onStartDragging);
            draggableSelectedZone.removeEventListener('touchstart', onStartDragging);

            window.removeEventListener('mousemove', onDrag);
            window.removeEventListener('touchmove', onDrag);

            window.removeEventListener('mouseup', onStopDragging);
            window.removeEventListener('touchend', onStopDragging);

            // Cancel the update loop
            cancelAnimationFrame(updateAnimationFrameId);
        };
    }, [getSanitizedStartEndTimes, throttledSetVideoTime, videoAssetDuration]);

    useEffect(() => {
        // We will scroll the timeline if start or end times get within 5% of the edge on either side of the timeline
        const timelineScrollZoneWidthSeconds = 0.05 * secondsInTimelineWidth;

        // Limit so we don't scroll the timeline by more than 65% of a scroll zone width each frame
        // 65% is just a fairly arbitrary number that felt good
        const maxTimelineScrollShiftAmount = timelineScrollZoneWidthSeconds * 0.65;

        // Determine how far the trim start handle is into the timeline's left "scroll zone"
        // (ie, the first 5% of the visible timeline's width)
        // Positive number = outside of the scroll zone, negative number = inside
        const trimStartScrollZoneDistance =
            trimStartTime - (timelineScrollTime + timelineScrollZoneWidthSeconds);

        // Determine how far the trim end handle is into the timeline's right "scroll zone"
        // (ie, the last 5% of the visible timeline's width)
        // Negative number = outside of the scroll zone, positive number = inside
        const trimEndScrollZoneDistance =
            trimEndTime - (timelineScrollTime + secondsInTimelineWidth - timelineScrollZoneWidthSeconds);

        if (trimStartScrollZoneDistance < 0) {
            // If the trim start handle is in the timeline's left "scroll zone", we should shift the timeline
            // left accordingly
            setTimelineScrollTime(
                // Make sure we clamp our new scroll time so it doesn't go below 0
                Math.max(
                    timelineScrollTime +
                    // Scroll the timeline by the trim start handle's distance into the scroll zone, capping it at our maximum shift amount
                    Math.max(trimStartScrollZoneDistance, -maxTimelineScrollShiftAmount),
                    0,
                ),
            );
        } else if (trimEndScrollZoneDistance > 0) {
            // If the trim end handle is in the timeline's right "scroll zone", we should shift the timeline
            // right accordingly
            setTimelineScrollTime(
                // Make sure we clamp our new scroll time so it doesn't go beyond the right edge
                Math.min(
                    timelineScrollTime +
                    // Scroll the timeline by the trim end handle's distance into the scroll zone, capping it at our maximum shift amount
                    Math.min(trimEndScrollZoneDistance, maxTimelineScrollShiftAmount),
                    videoAssetDuration - secondsInTimelineWidth,
                ),
            );
        }
    }, [secondsInTimelineWidth, timelineScrollTime, trimEndTime, trimStartTime, videoAssetDuration]);

    useEffect(() => {
        const videoElement = videoElementRef.current;

        // As soon as the video is loaded enough that we can seek it, ensure that it is set to display the video
        // at the selected start time
        const onVideoLoadedMetadata = () => {
            videoElement.currentTime = trimStartTime;
        };
        videoElement.addEventListener('loadedmetadata', onVideoLoadedMetadata);

        // Clean up event listeners
        return () => {
            videoElement.removeEventListener('loadedmetadata', onVideoLoadedMetadata);
        };
    }, [trimStartTime, videoElementRef]);

    useEffect(() => {
        // Update the video's playback rate to match how much it will be sped up
        // by the renderer to fit inside the video field's display time
        // Currently, we are only modifying the playback rate if the trim duration is longer than the base
        // field duration, so we'll ensure that we just keep the playback rate at 1 otherwise
        const videoElement = videoElementRef.current;
        videoElement.playbackRate = Math.max(trimDuration / videoFieldPlaybackDuration, 1);
    }, [trimDuration, videoElementRef, videoFieldPlaybackDuration]);

    /**
     * Updates the trim selection's start and end times
     *
     * @param {number}  newStartTime
     * @param {number}  newEndTime
     */
    const updateStartEndTimes = (newStartTime, newEndTime) => {
        // Pause video playback if it's currently playing a preview
        pauseVideo();

        const sanitizedStartEndTimes = getSanitizedStartEndTimes(newStartTime, newEndTime);

        if (
            sanitizedStartEndTimes.startTime !== trimStartTime ||
            sanitizedStartEndTimes.endTime !== trimEndTime
        ) {
            // If the start and/or end time changed, update our state to reflect these new times
            setTrimStartEndTimes(sanitizedStartEndTimes);
        }
    };

    // Use a threshold of 2% of the timeline's width where the trim handles will snap to points if any closer than that
    const trimHandleSnapThreshold = secondsInTimelineWidth * 0.02;

    /**
     * onchange event for the trim start input updates the start time for the trim selection
     */
    const onChangeTrimStartTime = (event) => {
        // Parse the new start time from the input range's current value
        let newStartTime = Number(event.target.value);

        const currentTimeInputTime = Number(currentTimeInputRef.current.value);
        const trimStartTimeForDefaultLength = trimEndTime - videoFieldPlaybackDuration;

        if (Math.abs(trimStartTimeForDefaultLength - newStartTime) < trimHandleSnapThreshold) {
            // If the scrubber is within the snap threshold of the start time value that would make the trim selection match
            // the field's base default playback duration, snap to it
            newStartTime = trimStartTimeForDefaultLength;
        } else if (Math.abs(currentTimeInputTime - newStartTime) < trimHandleSnapThreshold) {
            // If the scrubber is within the snap threshold of the playback time indicator bar, snap to it
            newStartTime = currentTimeInputTime;
        }

        const newClipDuration = trimEndTime - newStartTime;

        // Clamp the times to ensure they stay within our min and max durations
        if (newClipDuration < minClipDuration) {
            newStartTime = trimEndTime - minClipDuration;
        } else if (newClipDuration > maxClipDuration) {
            newStartTime = trimEndTime - maxClipDuration;
        }

        updateStartEndTimes(newStartTime, trimEndTime);
    };

    /**
     * onchange event for the trim end input updates the selected trim end time
     */
    const onChangeTrimEndTime = (event) => {
        // Parse the new end time from the input range's current value
        let newEndTime = Number(event.target.value);

        const currentTimeInputTime = Number(currentTimeInputRef.current.value);
        const trimEndTimeForDefaultLength = trimStartTime + videoFieldPlaybackDuration;

        if (Math.abs(trimEndTimeForDefaultLength - newEndTime) < trimHandleSnapThreshold) {
            // If the scrubber is within the snap threshold of the end time value that would make the trim selection match
            // the field's base default playback duration, snap to it
            newEndTime = trimEndTimeForDefaultLength;
        } else if (Math.abs(newEndTime - currentTimeInputTime) < trimHandleSnapThreshold) {
            // If the scrubber is closer to the playback time indicator bar than 2.5% of the timeline's width, snap to it
            newEndTime = currentTimeInputTime;
        }

        const newClipDuration = newEndTime - trimStartTime;

        // Clamp the times to ensure they stay within our min and max durations
        if (newClipDuration < minClipDuration) {
            newEndTime = trimStartTime + minClipDuration;
        } else if (newClipDuration > maxClipDuration) {
            newEndTime = trimStartTime + maxClipDuration;
        }

        updateStartEndTimes(trimStartTime, newEndTime);
    };

    /**
     * Reset the trim selection to the default duration
     */
    const onClickResetClipDuration = () => {
        // By default, keep the start time the same and just change the end time to match our default playback duration
        let newStartTime = trimStartTime;
        let newEndTime = trimStartTime + videoFieldPlaybackDuration;

        if (newEndTime > videoAssetDuration) {
            // If shifting the end time relative to the start time would result in it going out of the bounds of the clip,
            // clamp the end time to the end of the asset and shift the start time back
            newEndTime = videoAssetDuration;
            // Ensure our start time doesn't go below 0 in scenarios where the asset is shorter than the video field's base playback duration
            newStartTime = Math.max(videoAssetDuration - videoFieldPlaybackDuration, 0);
        }

        updateStartEndTimes(newStartTime, newEndTime);
    };

    // Get the positions of the start and end points as percentages of the total video asset's duration
    const trimStartPercentage = trimStartTime / videoAssetDuration;
    const trimEndPercentage = trimEndTime / videoAssetDuration;

    // Get the positions of the start and end points as percentages relative to how they're visually displayed in the timeline
    const trimStartTimelinePositionPercentage =
        (trimStartTime - timelineScrollTime) / secondsInTimelineWidth;
    const trimEndTimelinePositionPercentage =
        (trimEndTime - timelineScrollTime) / secondsInTimelineWidth;

    // If the trim selection is shorter than 18% of the timeline, we should shift the clip duration label outside of the selection
    // so that the user will still be able to see it
    let clipDurationLabelShiftDirection = styles.LabelShiftDirection.none;
    const shouldClipDurationLabelShiftOutsideSelection =
        trimDuration / secondsInTimelineWidth <= 0.18;

    if (shouldClipDurationLabelShiftOutsideSelection) {
        clipDurationLabelShiftDirection =
            trimStartTimelinePositionPercentage <= 0.5 ?
            styles.LabelShiftDirection.right :
            styles.LabelShiftDirection.left;
    }

    // If the selected clip's duration is > .05 seconds longer or shorter from the base duration, show a message explaining that
    // the clip's speed will be modified or held on its last frame and show a button to reset to the base duration
    const hasTrimDurationWarning = Math.abs(videoFieldPlaybackDuration - trimDuration) > 0.05;

    return ( <
        div className = {
            styles.TrimSection
        } >
        <
        div className = {
            styles.TrimControlBar
        }
        style = {
            assignInlineVars({
                [styles.trimStartPercentageVar]: `${trimStartPercentage}`,
                [styles.trimEndPercentageVar]: `${trimEndPercentage}`,
            })
        } >
        <
        button onClick = {
            onTogglePlayback
        }
        type = "button"
        className = {
            styles.PlayPauseButton
        } > {
            isPlayingPreview ? ( <
                PauseIcon color = {
                    defaultIconColor
                }
                />
            ) : ( <
                PlayIcon color = {
                    defaultIconColor
                }
                />
            )
        } <
        /button> <
        div className = {
            styles.TrimTimelineWrapper
        } >
        <
        div className = {
            styles.TrimTimeline
        }
        style = {
            {
                width: `${(100 * videoAssetDuration) / secondsInTimelineWidth}%`,
                // Translate the timeline to reflect its scroll position
                transform: `translateX(${-100 * (timelineScrollTime / videoAssetDuration)}%)`,
            }
        }
        ref = {
            trimSliderControlsRef
        }
        data - testid = "trimTimeline" >
        <
        TrimControlTimelineCanvas currentlyEditingVideoField = {
            currentlyEditingVideoField
        }
        /> <
        div className = {
            styles.TrimBefore
        }
        data - testid = "trimBefore" / > {
            /* Input displays an indicator bar for the current time in the preview video's playback and allows the
                            user to scrub through the video */
        } <
        input type = "range"
        className = {
            styles.VideoPreviewPlaybackTimeInput
        }
        defaultValue = {
            trimStartTime
        }
        min = {
            0
        }
        max = {
            videoAssetDuration
        }
        step = "0.01"
        ref = {
            currentTimeInputRef
        }
        onChange = {
            () => {
                const currentTime = Number(currentTimeInputRef.current.value);
                // Clamp the time input so that the user can't drag it outside of the trim selection
                if (currentTime < trimStartTime) {
                    currentTimeInputRef.current.value = `${trimStartTime}`;
                }

                if (currentTime > trimEndTime) {
                    currentTimeInputRef.current.value = `${trimEndTime}`;
                }

                // When the user scrubs the time input, update the preview video to display that time
                throttledSetVideoTime(Number(currentTimeInputRef.current.value));
            }
        }
        data - testid = "currentPlaybackTimeInput" /
        > { /* Input sets the trim start point */ } <
        input type = "range"
        value = {
            trimStartTime
        }
        min = {
            0
        }
        max = {
            videoAssetDuration
        }
        step = "0.01"
        onChange = {
            onChangeTrimStartTime
        }
        className = {
            styles.TrimInputStart
        }
        data - testid = "trimStartTimeInput" /
        > { /* Zone representing the currently selected portion of the clip between the start and end handles */ } <
        div className = {
            styles.TrimSelectedZone
        } { ...styles.dataHasTrimDurationWarning(hasTrimDurationWarning)
        }
        ref = {
            draggableSelectedZoneRef
        }
        data - testid = "trimSelectedZone" >
        { /* Inverted corners on the left edge of selected zone/right edge of the start handle */ } <
        div className = {
            styles.TrimInputInvertedCornerContainer
        } { ...styles.dataInvertedCornerPosition('topLeft')
        } >
        <
        div className = {
            styles.TrimInputInvertedCorner
        }
        /> <
        /div> <
        div className = {
            styles.TrimInputInvertedCornerContainer
        } { ...styles.dataInvertedCornerPosition('bottomLeft')
        } >
        <
        div className = {
            styles.TrimInputInvertedCorner
        }
        /> <
        /div> { /* Label displays the current length of the trimmed clip */ } <
        div className = {
            styles.CurrentClipDurationLabel
        } { ...styles.dataLabelShiftDirection(clipDurationLabelShiftDirection)
        }
        data - testid = "trimDurationLabel" >
        {
            trimDuration.toFixed(1)
        }
        s <
        /div> { /* Inverted corners on the right edge of the selected zone/left edge of the end handle */ } <
        div className = {
            styles.TrimInputInvertedCornerContainer
        } { ...styles.dataInvertedCornerPosition('topRight')
        } >
        <
        div className = {
            styles.TrimInputInvertedCorner
        }
        /> <
        /div> <
        div className = {
            styles.TrimInputInvertedCornerContainer
        } { ...styles.dataInvertedCornerPosition('bottomRight')
        } >
        <
        div className = {
            styles.TrimInputInvertedCorner
        }
        /> <
        /div> <
        /div> { /* Input sets the trim end point */ } <
        input type = "range"
        value = {
            trimEndTime
        }
        min = {
            0
        }
        max = {
            videoAssetDuration
        }
        step = "0.01"
        onChange = {
            onChangeTrimEndTime
        }
        className = {
            styles.TrimInputEnd
        }
        data - testid = "trimEndTimeInput" /
        > { /* Zone extends from the trim end handle to the edge of the timeline */ } <
        div className = {
            styles.TrimAfter
        }
        data - testid = "trimAfter" >
        <
        div className = {
            styles.VideoAssetDurationLabel
        }
        style = {
            {
                // Using the formula o = 9.2 -10x so the asset duration badge's opacity will fade down from 1 to 0
                // as the clip's end handle position travels between the 82% and 92% positions on the timeline so that
                // it won't look awkward as the handle gets closer and eventually overlaps this badge
                opacity: -10 * trimEndTimelinePositionPercentage + 9.2,
            }
        }
        data - testid = "assetDurationLabel" >
        {
            videoAssetDuration.toFixed(1)
        }
        s <
        /div> <
        /div> { /* Faded edges indicate whether the user can scroll the timeline left or right */ } <
        div className = {
            styles.StartScrollEdge
        }
        // Show this scrollable edge indicator if the timeline is scrolled past 0 and therefore the left
        // side of the timeline is hidden
        { ...styles.dataIsEdgeScrollable(timelineScrollTime > 0)
        }
        style = {
            {
                // Keep the faded edge positioned on the left side of the visible portion of the timeline based on
                // our timeline scroll position
                left: `${(timelineScrollTime / videoAssetDuration) * 100}%`,
            }
        }
        data - testid = "startScrollEdge" /
        >
        <
        div className = {
            styles.EndScrollEdge
        }
        // Show this scrollable edge indicator if the timeline is not scrolled far enough so that the right
        // side of the timeline is hidden
        { ...styles.dataIsEdgeScrollable(
                timelineScrollTime + secondsInTimelineWidth < videoAssetDuration,
            )
        }
        style = {
            {
                // Keep the faded edge positioned on the right side of the visible portion of the timeline based on
                // our timeline scroll position
                right: `${
                  ((videoAssetDuration - (timelineScrollTime + secondsInTimelineWidth)) /
                    videoAssetDuration) *
                  100
                }%`,
            }
        }
        data - testid = "endScrollEdge" /
        >
        <
        /div> <
        /div> <
        /div> <
        EditorVideoTrimDurationWarning videoAssetDuration = {
            videoAssetDuration
        }
        videoFieldPlaybackDuration = {
            videoFieldPlaybackDuration
        }
        trimDuration = {
            trimDuration
        }
        onClickResetClipDuration = {
            onClickResetClipDuration
        }
        hasTrimDurationWarning = {
            hasTrimDurationWarning
        }
        /> <
        /div>
    );
}
EditorVideoTrimControls.propTypes = {
    currentlyEditingVideoField: editorPropTypes.editorVideoField.isRequired,
    videoAssetMetadata: PropTypes.shape({
        length: PropTypes.number,
        width: PropTypes.number,
        height: PropTypes.number,
    }).isRequired,
    currentConfigurationValue: PropTypes.object.isRequired,
    updateVideoConfigurationValue: PropTypes.func.isRequired,
    videoElementRef: PropTypes.shape({
        current: PropTypes.instanceOf(HTMLVideoElement)
    }).isRequired,
};