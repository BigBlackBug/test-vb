// Vendor
import _ from 'lodash';

// Local
import {
    waitFor
} from './async.js';

export const logEventTypes = {
    goToFrameStart: 'goToFrame:start',
    setupStart: 'setup:start',
    goToFrameEnd: 'goToFrame:end',
    setupEnd: 'setup:end',
    updateRealFPS: 'updateRealFPS',
    frameRenderStart: 'frameRender:start',
    frameRenderEnd: 'frameRender:end',
    complete: 'playback:complete',
    message: 'message',
    tearDown: 'tearDown',
    syncToFrame: 'syncToFrame',
};

/**
 * Convert milliseconds to a frame number.
 *
 * @param  {number} ms  Milliseconds
 * @param  {number} fps Frames per second
 * @return {number}     Frame number
 */
function msToFrameNumber(ms, fps) {
    const frameNumber = (ms / 1000) * fps;
    return Math.round(frameNumber);
}

/**
 * Create video layer groups for a specified event array and video layer index.
 *
 * This returns `steps`, which contains events sorted by step type, and
 * `measuringAndAdjustingGroups`, a linear timeline that represents the video layer's measurement
 * and adjustment actions.
 *
 * @param  {[Object]} events          Timeline events array
 * @param  {Number}   videoLayerIndex Video layer index
 * @return {Object}                   Steps and measurment and adjustment groups
 */
function createVideoLayerGroups(events, videoLayerIndex) {
    const measuringAndAdjustingGroups = [];
    const steps = {};

    // eslint-disable-next-line no-loop-func
    events.forEach((event, eventIndex) => {
        if (event.videoLayerIndex !== videoLayerIndex) {
            return;
        }

        const {
            requestedFrameNumber,
            actualFrameNumber,
            step
        } = event;

        if (!(step in steps)) {
            steps[step] = {
                total: 0,
                totalDisplaced: 0,
                frameOffsets: [],
                averageFrameOffset: null,
            };
        }

        steps[step].total += 1;

        const frameOffset = actualFrameNumber - requestedFrameNumber;

        steps[step].frameOffsets.push(frameOffset);

        if (frameOffset !== 0) {
            steps[step].totalDisplaced += 1;
        }

        if (step === 'measuring') {
            if (eventIndex === 0 || events[eventIndex - 1].step !== 'measuring') {
                measuringAndAdjustingGroups.push({
                    videoLayerIndex,
                    step: 'measuring',
                    frameOffsets: [],
                    frameNumber: requestedFrameNumber,
                });
            }
            measuringAndAdjustingGroups[measuringAndAdjustingGroups.length - 1].frameOffsets.push(
                frameOffset,
            );
        } else if (step === 'adjusting') {
            if (eventIndex === 0 || events[eventIndex - 1].step !== 'adjusting') {
                measuringAndAdjustingGroups.push({
                    videoLayerIndex,
                    step: 'adjusting',
                    frameOffsets: [],
                    frameNumber: requestedFrameNumber,
                });
            }
            measuringAndAdjustingGroups[measuringAndAdjustingGroups.length - 1].frameOffsets.push(
                frameOffset,
            );
        }
    });

    return {
        measuringAndAdjustingGroups,
        steps
    };
}

/**
 * Convert fps to an rgb color array.
 *
 * fps >= 60 returns green
 * fps 59 >= 40 returns light grey.
 * fps 39 >= 30 returns yellow.
 * fps 29 >= 20 returns orange.
 * fps <= 19 returns red.
 *
 * @param  {number}   fps fps
 * @return {[number]}     [red, green, blue] color array
 */
export function fpsToRGB(fps) {
    const limitedFPS = Math.min(Math.round(fps), 60);

    if (limitedFPS >= 60) {
        // return green
        return [104, 242, 168];
    } else if (limitedFPS < 60 && limitedFPS >= 40) {
        // return light grey
        return [214, 215, 217];
    } else if (limitedFPS < 40 && limitedFPS >= 30) {
        // return yellow
        return [255, 249, 79];
    } else if (limitedFPS < 30 && limitedFPS >= 20) {
        // return orange
        return [255, 171, 71];
    }

    // return red
    return [255, 61, 0];
}

/**
 * Performance timeline that represents a set of events from
 * a renderer. Data such as framerate, setup time, and missing
 * frames can be calculated.
 */
export class PerformanceTimeline {
    constructor(
        options = {
            events: [],
            branch: null,
            createdAt: null,
            fps: 30,
            onNewFrameReceived: () => {},
            onRendererSetupCompleted: () => {},
            onRealFPSUpdated: () => {},
        },
    ) {
        const {
            events,
            branch,
            createdAt,
            fps,
            onNewFrameReceived,
            onRendererSetupCompleted,
            onRealFPSUpdated,
        } = options;

        this.reset();

        this.branch = branch || null;
        this.createdAt = createdAt || new Date();
        this.fps = fps || 30;
        this.onNewFrameReceived = onNewFrameReceived || (() => {});
        this.onRendererSetupCompleted = onRendererSetupCompleted || (() => {});
        this.onRealFPSUpdated = onRealFPSUpdated || (() => {});

        this.addEvents(events);
    }

    /**
     * Reset the performance timeline to an empty state.
     */
    reset() {
        this.createdAt = new Date();
        this.branch = null;
        this.events = [];
        this.previousFrameNumber = 0;
        this.previoussetupStartEvent = null;
        this.previousframeRenderStartEvent = null;
        this.previousgoToFrameStartEvent = null;
        this.hasCompleted = false;
        this.finalFrameNumber = 0;
        this.hasTornDown = false;
        this.videoLayerSprites = [];
    }

    /**
     * Add an array of renderer events to the timeline.
     * Warning: Events are assumed to be sorted in order of occurrence.
     *
     * @param {[object]}  events  Renderer events
     */
    addEvents(events) {
        events.forEach(this.addEvent);
    }

    /**
     * Add a renderer event to the timeline.
     * Warning: addEvent must be called for events in order of occurence.
     *
     * @param {[object]}  event  Renderer event
     */
    addEvent(event) {
        const callbacks = [];

        const timelineEvent = {
            type: event.type,
            timestamp: event.timestamp,
        };

        switch (timelineEvent.type) {
            case logEventTypes.setupStart:
                {
                    this.previoussetupStartEvent = timelineEvent;
                    break;
                }
            case logEventTypes.setupEnd:
                {
                    if (this.previoussetupStartEvent) {
                        timelineEvent.beganAt = this.previoussetupStartEvent.timestamp;
                        timelineEvent.duration = timelineEvent.timestamp - timelineEvent.beganAt;
                        this.previoussetupStartEvent = null;
                    } else {
                        timelineEvent.beganAt = null;
                        timelineEvent.duration = null;
                    }
                    callbacks.push(this.onRendererSetupCompleted);
                    break;
                }
            case logEventTypes.frameRenderStart:
                {
                    this.previousframeRenderStartEvent = timelineEvent;
                    timelineEvent.frameNumber = Math.round(event.payload.frameNumber);
                    break;
                }
            case logEventTypes.frameRenderEnd:
                {
                    timelineEvent.frameNumber = Math.round(event.payload.frameNumber);
                    timelineEvent.beganAt = this.previousframeRenderStartEvent.timestamp;
                    timelineEvent.duration = timelineEvent.timestamp - timelineEvent.beganAt;
                    this.previousframeRenderStartEvent = null;
                    if (timelineEvent.frameNumber > this.previousFrameNumber) {
                        this.previousFrameNumber = timelineEvent.frameNumber;
                        callbacks.push(this.onNewFrameReceived);
                    }
                    break;
                }
            case logEventTypes.goToFrameStart:
                {
                    this.previousgoToFrameStartEvent = timelineEvent;
                    break;
                }
            case logEventTypes.goToFrameEnd:
                {
                    timelineEvent.beganAt = this.previousgoToFrameStartEvent ?
                    this.previousgoToFrameStartEvent.timestamp :
                        null;

                    timelineEvent.duration = timelineEvent.timestamp - timelineEvent.beganAt;
                    this.previousgoToFrameStartEvent = null;
                    break;
                }
            case logEventTypes.updateRealFPS:
                {
                    timelineEvent.beginRenderTime = event.payload.beginRenderTime;
                    timelineEvent.endRenderTime = event.payload.endRenderTime;
                    timelineEvent.renderDuration = timelineEvent.endRenderTime - timelineEvent.beginRenderTime;
                    timelineEvent.realFPS = event.payload.realFPS;
                    callbacks.push(this.onRealFPSUpdated);
                    break;
                }
            case logEventTypes.complete:
                {
                    this.hasCompleted = true;
                    this.finalFrameNumber = this.previousFrameNumber;
                    break;
                }
            case logEventTypes.message:
                {
                    timelineEvent.body = event.payload.body;
                    break;
                }
            case logEventTypes.syncToFrame:
                {
                    if (!this.videoLayerSprites.includes(event.payload.sprite)) {
                        this.videoLayerSprites.push(event.payload.sprite);
                    }
                    timelineEvent.videoLayerIndex = this.videoLayerSprites.indexOf(event.payload.sprite);
                    timelineEvent.requestedFrameNumber = event.payload.requestedFrameNumber;
                    timelineEvent.actualFrameNumber = event.payload.actualFrameNumber;
                    timelineEvent.resolvedFrameNumber = event.payload.resolvedFrameNumber;
                    timelineEvent.step = event.payload.step;
                    break;
                }
            case logEventTypes.tearDown:
                {
                    this.hasTornDown = true;
                    break;
                }
            default:
                {
                    break;
                }
        }

        this.events.push(timelineEvent);

        callbacks.forEach((callback) => {
            callback(timelineEvent);
        });

        return timelineEvent;
    }

    /**
     * Generate a human-readable text report for the timeline.
     *
     * @param   {number}   options.startFrameNumber                 Start frame number
     * @param   {number}   options.endFrameNumber                   End frame number.
     *                                                              The frame at this index will be included in the report
     * @param   {boolean}  options.shouldGenerateFullDetails        Should include full details: branch name, created date, etc
     * @param   {boolean}  options.shouldGenerateVideoLayerDetails  Should include detailed information on video layer playback
     * @return  {string}                                            Report
     */
    generateReport({
        startFrameNumber = 0,
        endFrameNumber = this.finalFrameNumber,
        title = null,
        shouldGenerateFullDetails = true,
        shouldGenerateVideoLayerDetails = true,
    } = {}) {
        const statistics = this.calculateStatistics({
            startFrameNumber,
            endFrameNumber
        });

        let report = '';

        if (title) {
            report += `Report title:                             ${title}\n`;
        }

        if (shouldGenerateFullDetails) {
            const setupEndEvent = this.events.find((event) => event.type === logEventTypes.setupEnd);
            let rendererSetupDurationMessage;
            let rendererSetupBeganAtMessage;

            if (setupEndEvent && setupEndEvent.duration) {
                rendererSetupDurationMessage = `${setupEndEvent.duration.toFixed(3)}ms`;
                rendererSetupBeganAtMessage = setupEndEvent.beganAt.toFixed(3);
            } else {
                const missingFieldMessage =
                    'Create the performance profiler before calling renderer setup() to populate this field.';

                rendererSetupDurationMessage = missingFieldMessage;
                rendererSetupBeganAtMessage = missingFieldMessage;
            }

            report += `Performance profile created at:           ${this.createdAt}\n`;
            report += `Performance profile created from branch:  ${this.branch}\n`;
            report += `Timeline event count:                     ${this.events.length}\n`;
            report += `Animation has completed:                  ${this.hasCompleted}\n`;
            report += `Renderer setup() began at:                ${rendererSetupBeganAtMessage}\n`;
            report += `Renderer setup() duration:                ${rendererSetupDurationMessage}\n`;
        }

        report += `Frames:                                   ${statistics.startFrameNumber}-${endFrameNumber}, ${statistics.missingFrameNumbers.length} missing\n`;
        report += `Average PixiJS render duration:           ${statistics.averageFrameRenderDuration.toFixed(
      3,
    )}ms\n`;
        report += `Average requestAnimationFrame duration:   ${statistics.averageRenderDuration.toFixed(
      3,
    )}ms\n`;
        report += `Average frame real FPS:                   ${statistics.averageRealFPS.toFixed(3)}\n`;

        if (statistics.videoLayers.length) {
            statistics.videoLayers.forEach((videoLayerData) => {
                const {
                    displacedFrameCount,
                    stepCounts,
                    syncEventCount,
                    videoLayerIndex
                } = videoLayerData;

                // Print total sync event count and breakdown by event type
                report += `Video layer ${videoLayerIndex} total sync events:          ${syncEventCount}\n`;
                // eslint-disable-next-line no-loop-func
                Object.entries(stepCounts).forEach(([name, count]) => {
                    let spaces = '';
                    for (let i = name.length; i < 19; i += 1) {
                        spaces += ' ';
                    }
                    report += `Video layer ${videoLayerIndex} ${name} events: ${spaces}${count}/${syncEventCount} (${Number(
            (count / syncEventCount) * 100,
          ).toFixed(2)}%)\n`;
                });

                // Print total displaced frame count
                report += `Video layer ${videoLayerIndex} displaced frame count:      ${displacedFrameCount}\n`;
            });

            if (shouldGenerateVideoLayerDetails) {
                report += 'Video layer measurements and adjustments:\n';
                const videoLayerGroups = statistics.videoLayers.map(({
                        measuringAndAdjustingGroups
                    }) =>
                    _.cloneDeep(measuringAndAdjustingGroups),
                );

                // Iterate over each video layer measuring+adjusting group array frame-by-frame
                // and print group results in frame order.
                for (let frameNumber = 0; frameNumber < endFrameNumber; frameNumber += 1) {
                    let hasMessage = false;

                    // eslint-disable-next-line no-loop-func
                    videoLayerGroups.forEach((groups) => {
                        if (groups.length && groups[0].frameNumber <= frameNumber) {
                            const currentGroup = groups.shift();
                            if (!hasMessage) {
                                report += `\tFrame ${currentGroup.frameNumber}\n`;
                                hasMessage = true;
                            }
                            report += `\t\tVideo layer ${currentGroup.videoLayerIndex} ... Measured ${
                currentGroup.frameOffsets.length
              } times. Offsets: [${currentGroup.frameOffsets.join(', ')}]\n`;
                            if (groups.length && groups[0].step === 'adjusting') {
                                const adjustingGroup = groups.shift();
                                report += `\t\t                  Adjusted ${
                  adjustingGroup.frameOffsets.length
                } times. Offsets: [${adjustingGroup.frameOffsets.join(', ')}]\n`;
                            }
                        }
                    });
                }
            }
        }

        return report;
    }

    /**
     * Get events with optional frame number, timestamp, and goToFrame filters.
     *
     * @param  {number}   options.startFrameNumber             Start frame number value
     * @param  {number}   options.endFrameNumber               End frame number value
     * @param  {number}   options.startTimestamp               Start timestamp value
     * @param  {number}   options.endTimestamp                 End timestamp value
     * @param  {boolean}  options.shouldTrimToLatestGoToFrame  Don't include all events up to the last goToFrame call.
     *                                                         This is useful because replaying a template results in
     *                                                         a goToFrame(0) call that skews the average updateRealFPS
     *                                                         values.
     * @return {[object]}                                      Array of events
     */
    getEvents(
        options = {
            startFrameNumber: null,
            endFrameNumber: null,
            startTimestamp: null,
            endTimestamp: null,
            shouldTrimToLatestGoToFrame: true,
        },
    ) {
        const {
            startFrameNumber,
            endFrameNumber,
            startTimestamp,
            endTimestamp,
            shouldTrimToLatestGoToFrame,
        } = {
            startFrameNumber: null,
            endFrameNumber: null,
            startTimestamp: null,
            endTimestamp: null,
            shouldTrimToLatestGoToFrame: true,
            ...options,
        };

        let startIndex;

        if (shouldTrimToLatestGoToFrame) {
            const lastGoToFrameEventIndex = _.findLastIndex(this.events, [
                'type',
                logEventTypes.goToFrameEnd,
            ]);
            if (lastGoToFrameEventIndex !== -1) {
                // If a goToFrame event is found, clear successive events until a frameRenderStart event is
                // reached.
                startIndex =
                    this.events
                    .slice(lastGoToFrameEventIndex)
                    .findIndex(({
                        type
                    }) => type === logEventTypes.frameRenderStart) +
                    lastGoToFrameEventIndex;
            } else {
                startIndex = 0;
            }
        } else {
            startIndex = 0;
        }

        let hasChunkBegun = false;
        const chunk = [];
        for (let i = startIndex; i < this.events.length; i += 1) {
            const event = this.events[i];

            const isPastEndTimestamp = endTimestamp !== null && event.timestamp > endTimestamp;
            const isAtEndFrameNumber =
                endFrameNumber !== null &&
                typeof event.frameNumber !== 'undefined' &&
                event.frameNumber === endFrameNumber;
            const isPastEndFrameNumber =
                endFrameNumber !== null &&
                typeof event.frameNumber !== 'undefined' &&
                event.frameNumber > endFrameNumber;

            if (isPastEndFrameNumber || isPastEndTimestamp) {
                break;
            }

            if (!hasChunkBegun) {
                const isPastStartFrameNumber =
                    startFrameNumber === null ||
                    (event.type === logEventTypes.frameRenderStart && event.frameNumber >= startFrameNumber);
                const isPastStartTimestamp = startTimestamp === null || event.timestamp >= startTimestamp;
                if (isPastStartFrameNumber && isPastStartTimestamp) {
                    hasChunkBegun = true;
                }
            }

            if (hasChunkBegun) {
                chunk.push(event);
            }

            if (isAtEndFrameNumber) {
                break;
            }
        }

        return chunk;
    }

    /**
     * Calculate a statistics object for the timeline.
     *
     * @param  {number}   options.startFrameNumber             Start frame number value
     * @param  {number}   options.endFrameNumber               End frame number value
     *                                                         The frame at this index will be included in the statistics
     * @param  {number}   options.startTimestamp               Start timestamp value
     * @param  {number}   options.endTimestamp                 End timestamp value
     * @param  {boolean}  options.shouldTrimToLatestGoToFrame  Don't include all events up to the last goToFrame call.
     *                                                         This is useful because replaying a template results in
     *                                                         a goToFrame(0) call that skews the average updateRealFPS
     *                                                         values.
     * @return  {object}                                       Statistics
     */
    calculateStatistics({
        startFrameNumber = null,
        endFrameNumber = null,
        startTimestamp = null,
        endTimestamp = null,
        shouldTrimToLatestGoToFrame = true,
    } = {}) {
        const events = this.getEvents({
            startFrameNumber,
            endFrameNumber,
            startTimestamp,
            endTimestamp,
            shouldTrimToLatestGoToFrame,
        });

        const presentFrameNumbers = [];
        events.forEach((event) => {
            if (
                typeof event.frameNumber !== 'undefined' &&
                presentFrameNumbers.indexOf(event.frameNumber) === -1
            ) {
                presentFrameNumbers.push(event.frameNumber);
            }
        });

        const missingFrameNumbers = [];
        for (let i = startFrameNumber; i <= endFrameNumber; i += 1) {
            if (presentFrameNumbers.indexOf(i) === -1) {
                missingFrameNumbers.push(i);
            }
        }

        let frameCount = 0;
        let totalRenderDuration = 0;
        let totalFrameRenderDuration = 0;

        const allRealFPS = [];
        let totalWeightedFPS = 0;

        events.forEach((event) => {
            switch (event.type) {
                case logEventTypes.frameRenderEnd:
                    {
                        totalFrameRenderDuration += event.duration;
                        frameCount += 1;
                        break;
                    }
                case logEventTypes.updateRealFPS:
                    {
                        totalRenderDuration += event.renderDuration;
                        allRealFPS.push(event.realFPS);
                        totalWeightedFPS += event.realFPS * event.renderDuration;
                        break;
                    }
                default:
                    {
                        break;
                    }
            }
        });

        const averageFrameRenderDuration = frameCount ? totalFrameRenderDuration / frameCount : null;
        const averageRealFPS = totalRenderDuration ? totalWeightedFPS / totalRenderDuration : null;
        const averageRenderDuration = allRealFPS.length ?
            totalRenderDuration / allRealFPS.length :
            null;

        const videoLayers = [];

        for (let index = 0; index < this.videoLayerSprites.length; index += 1) {
            const syncToFrameEvents = events.filter(
                (event) => event.type === logEventTypes.syncToFrame && event.videoLayerIndex === index,
            );

            const {
                measuringAndAdjustingGroups,
                steps
            } = createVideoLayerGroups(
                syncToFrameEvents,
                index,
            );

            let totalDisplacedFrames = 0;
            Object.values(steps).forEach(({
                totalDisplaced
            }) => {
                totalDisplacedFrames += totalDisplaced;
            });

            const videoLayerData = {
                measuringAndAdjustingGroups,
                displacedFrameCount: totalDisplacedFrames,
                syncEventCount: syncToFrameEvents.length,
                stepCounts: {},
                videoLayerIndex: index,
            };

            // eslint-disable-next-line no-loop-func
            Object.entries(steps).forEach(([name, step]) => {
                videoLayerData.stepCounts[name] = step.total;
            });

            videoLayers.push(videoLayerData);
        }

        const statistics = {
            videoLayers,
            startFrameNumber,
            endFrameNumber,
            presentFrameNumbers,
            missingFrameNumbers,
            averageFrameRenderDuration,
            averageRealFPS,
            averageRenderDuration,
            allRealFPS,
        };

        return statistics;
    }

    /**
     * Generate a one dimensional fps heatmap for all real FPS event values.
     * Heatmap colors are indexed by frame numbers.
     *
     * @param  {number}   options.startFrameNumber             Start frame number value
     * @param  {number}   options.endFrameNumber               End frame number value
     *                                                         The frame at this index will be included in the statistics
     * @param  {number}   options.startTimestamp               Start timestamp value
     * @param  {number}   options.endTimestamp                 End timestamp value
     * @param  {boolean}  options.shouldTrimToLatestGoToFrame  Don't include all events up to the last goToFrame call.
     *                                                         This is useful because replaying a template results in
     *                                                         a goToFrame(0) call that skews the average updateRealFPS
     *                                                         values.
     * @return {[number]}                                      Heatmap color array
     */
    generateFPSHeatmap({
        startFrameNumber = null,
        endFrameNumber = null,
        startTimestamp = null,
        endTimestamp = null,
        shouldTrimToLatestGoToFrame = true,
    } = {}) {
        const heatmap = [];

        const alpha = 255;

        const events = this.getEvents({
            startFrameNumber,
            endFrameNumber,
            startTimestamp,
            endTimestamp,
            shouldTrimToLatestGoToFrame,
        });

        const updateRealFPSEvents = events.filter(({
            type
        }) => type === logEventTypes.updateRealFPS);

        let initialBeginRenderTime;
        updateRealFPSEvents.forEach(({
            beginRenderTime,
            endRenderTime,
            realFPS
        }, index) => {
            if (index === 0) {
                initialBeginRenderTime = beginRenderTime;
            }

            const normalizedBeginRenderTime = beginRenderTime - initialBeginRenderTime;
            const normalizedEndRenderTime = endRenderTime - initialBeginRenderTime;

            const beginRenderFrame = msToFrameNumber(normalizedBeginRenderTime, this.fps);
            const endRenderFrame = msToFrameNumber(normalizedEndRenderTime, this.fps);

            // Populate heatmap gaps with [0, 0, 0, alpha].
            // These should never exist unless the renderer has a bug that prevents it from firing
            // updateRealFPS events.
            while (heatmap.length < endRenderFrame) {
                heatmap.push([0, 0, 0, alpha]);
            }

            for (let i = beginRenderFrame; i < endRenderFrame; i += 1) {
                const [red, green, blue] = fpsToRGB(realFPS);

                heatmap[i] = [red, green, blue, alpha];
            }
        });

        return heatmap;
    }

    /**
     * Export a JSON-serializable object with all timeline information.
     *
     * @return  {object}  JSON-serializable object
     */
    toJSON() {
        const json = {
            createdAt: this.createdAt,
            branch: this.branch,
            events: this.events,
        };

        // Clone the exported JSON to dereference all data
        return _.cloneDeep(json);
    }

    /**
     * Create the timeline from a JSON object.
     *
     * @param  {object}  json  JSON object
     */
    static fromJSON(json) {
        // Clone the imported JSON to dereference all data
        const options = _.cloneDeep(json);
        const performanceTimeline = new PerformanceTimeline(options);
        return performanceTimeline;
    }

    /**
     * Wait for this.hasCompleted to evaluate to true, which is
     * triggered by a logEventTypes.complete event.
     */
    async waitForCompletion() {
        await waitFor(() => this.hasCompleted, {
            // 60000ms = 60s
            timeout: 60000,
        });
    }
}

/**
 * Watch a WaymarkAuthorWebRenderer for events and automatically
 * add them to a PerformanceTimeline.
 */
export class PerformanceProfiler {
    constructor(renderer, options = {
        branch: null
    }) {
        const {
            branch
        } = options;
        this.branch = branch;
        this.renderer = renderer;
        this.timelines = [];

        if (this.renderer.isSetup) {
            this.createNewTimeline();
        }

        this.renderer.on(logEventTypes.setupStart, this.onSetupStart);
        this.renderer.on(logEventTypes.setupEnd, this.onSetupEnd);
        this.renderer.on(logEventTypes.frameRenderStart, this.onFrameRenderStart);
        this.renderer.on(logEventTypes.frameRenderEnd, this.onFrameRenderEnd);
        this.renderer.on(logEventTypes.updateRealFPS, this.onUpdateRealFPS);
        this.renderer.on(logEventTypes.goToFrameStart, this.onGoToFrameStart);
        this.renderer.on(logEventTypes.goToFrameEnd, this.onGoToFrameEnd);
        this.renderer.on(logEventTypes.complete, this.onComplete);
        this.renderer.on(logEventTypes.message, this.onMessage);
        this.renderer.on(logEventTypes.syncToFrame, this.onSyncToFrame);
        this.renderer.on(logEventTypes.tearDown, this.onTearDown);
    }

    /**
     * Destroy all renderer event handlers.
     */
    tearDown() {
        this.renderer.off(logEventTypes.setupStart, this.onSetupStart);
        this.renderer.off(logEventTypes.setupEnd, this.onSetupEnd);
        this.renderer.off(logEventTypes.frameRenderStart, this.onFrameRenderStart);
        this.renderer.off(logEventTypes.frameRenderEnd, this.onFrameRenderEnd);
        this.renderer.off(logEventTypes.updateRealFPS, this.onUpdateRealFPS);
        this.renderer.off(logEventTypes.goToFrameStart, this.onGoToFrameStart);
        this.renderer.off(logEventTypes.goToFrameEnd, this.onGoToFrameEnd);
        this.renderer.off(logEventTypes.complete, this.onComplete);
        this.renderer.off(logEventTypes.message, this.onMessage);
        this.renderer.off(logEventTypes.syncToFrame, this.onSyncToFrame);
        this.renderer.off(logEventTypes.tearDown, this.onTearDown);
    }

    onSetupStart = (payload) => {
        if (!this.currentTimeline || this.currentTimeline.hasTornDown) {
            this.createNewTimeline();
        }

        this.logEvent(logEventTypes.setupStart, payload);
    };

    onSetupEnd = (payload) => {
        if (!this.currentTimeline || this.currentTimeline.hasTornDown) {
            this.createNewTimeline();
        }

        this.logEvent(logEventTypes.setupEnd, payload);
    };

    onFrameRenderStart = (payload) => {
        if (!this.currentTimeline || this.currentTimeline.hasTornDown) {
            this.createNewTimeline();
        }

        this.logEvent(logEventTypes.frameRenderStart, payload);
    };

    onFrameRenderEnd = (payload) => {
        if (!this.currentTimeline || this.currentTimeline.hasTornDown) {
            this.createNewTimeline();
        }

        this.logEvent(logEventTypes.frameRenderEnd, payload);
    };

    onUpdateRealFPS = (payload) => {
        if (!this.currentTimeline || this.currentTimeline.hasTornDown) {
            this.createNewTimeline();
        }

        this.logEvent(logEventTypes.updateRealFPS, payload);
    };

    onGoToFrameStart = (payload) => {
        if (!this.currentTimeline || this.currentTimeline.hasTornDown) {
            this.createNewTimeline();
        }

        this.logEvent(logEventTypes.goToFrameStart, payload);
    };

    onGoToFrameEnd = (payload) => {
        if (!this.currentTimeline || this.currentTimeline.hasTornDown) {
            this.createNewTimeline();
        }

        this.logEvent(logEventTypes.goToFrameEnd, payload);
    };

    onComplete = (payload) => {
        if (!this.currentTimeline || this.currentTimeline.hasTornDown) {
            this.createNewTimeline();
        }

        this.logEvent(logEventTypes.complete, payload);
    };

    onMessage = (payload) => {
        if (!this.currentTimeline || this.currentTimeline.hasTornDown) {
            this.createNewTimeline();
        }

        this.logEvent(logEventTypes.message, payload);
    };

    onSyncToFrame = (payload) => {
        if (!this.currentTimeline || this.currentTimeline.hasTornDown) {
            this.createNewTimeline();
        }

        this.logEvent(logEventTypes.syncToFrame, payload);
    };

    onTearDown = (payload) => {
        this.logEvent(logEventTypes.tearDown, payload);
    };

    /**
     * Create a new timeline, which will become the currentTimeline.
     * This is useful for creating new timelines for profiling separate features, or for running the
     * profiler multiple times on a single animation without tearing it down.
     */
    createNewTimeline() {
        const timeline = new PerformanceTimeline({
            branch: this.branch,
            events: [],
            fps: this.renderer.videoData.fr,
        });

        this.timelines.push(timeline);
    }

    /**
     * Log a renderer event.
     *
     * @param  {string}  type     Event type
     * @param  {object}  payload  Event payload
     */
    logEvent(type, payload = {}) {
        const timestamp = (performance || new Date()).now();
        const event = {
            type,
            timestamp,
            payload
        };
        this.currentTimeline.addEvent(event);
    }

    get currentTimeline() {
        return this.timelines[this.timelines.length - 1];
    }
}