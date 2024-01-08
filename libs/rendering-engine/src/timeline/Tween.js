import {
    LinearEase
} from './Ease.js';

export default class Tween {
    /**
     * @param      {object}  passedOptions  The options to create a tween
     * @param      {*}  passedOptions.valueStart  The property start
     * @param      {*}  passedOptions.valueEnd    The property end
     * @param      {number}  passedOptions.startTime      The start time
     * @param      {number}  passedOptions.duration       The duration
     * @param      {Ease}  passedOptions.ease           The ease
     */
    constructor(passedOptions) {
        const options = {
            valueStart: 0,
            valueEnd: 0,
            startTime: 0,
            duration: 0,
            ease: LinearEase,
            ...passedOptions,
        };
        this.valueStart = options.valueStart;
        this.valueEnd = options.valueEnd;
        this.startTime = options.startTime;
        this.duration = options.duration;
        this.ease = options.ease;
        this.timeline = options.timeline || null;
    }

    get endTime() {
        return this.startTime + this.duration;
    }

    /**
     * The start time of this tween on the global (root) timeline
     *
     * @type       {number}
     */
    get globalStartTime() {
        let startTimeOffset = 0;
        if (this.timeline) {
            startTimeOffset += this.timeline.getParentsStartTimeOffset();
        }
        return this.startTime + startTimeOffset;
    }

    /**
     * The end time of this tween on the global (root) timeline
     *
     * @type       {number}
     */
    get globalEndTime() {
        return this.globalStartTime + this.duration;
    }

    /**
     * Determines if a Tween is active at time.
     *
     * A tween is determined to be active if:
     * - The time is equal or greater than the startTime
     *     ex: sT=0, time=4 –> true
     *         sT=0, time=0 -> true
     *         sT=0, time=-1 -> false
     * - The time is less than the endTime
     *     ex: sT=0, eT=4, time=2 –> true
     *         sT=0, eT=4, time=5 -> false
     * - OR if it is an instantanous tween (a duration of 0), the time is during a 1 frame window after it is fired.
     *     ex: sT=5, eT=5, time=2 -> false
     *         sT=5, eT=5, time=5 -> true
     *
     * @param      {number}   time    The time
     * @return     {boolean}  True if active at time, False otherwise.
     */
    isActiveAtTime(time) {
        return (
            (Boolean(this.duration) && this.startTime <= time && this.endTime > time) ||
            (this.duration === 0 && this.startTime <= time && this.startTime + 1 > time)
        );
    }

    /**
     * Gets the value of the tween at time.
     *
     * @param      {number}  time    The time
     * @return     {*}  The value at time.
     */
    getValueAtTime(time) {
        if (time <= this.startTime) {
            return this.valueStart;
        } else if (time >= this.endTime) {
            return this.valueEnd;
            // If our property is a boolean, we can only change at the end
            // TODO: memoize this in the constructor?
        } else if (typeof this.valueStart === 'boolean') {
            return this.valueStart;
        }

        // Otherwise calculate the value based on the ease
        // progress is a 0 -> 1 value representing how far through the tween we are
        const progress = (time - this.startTime) / this.duration;
        // Get the progress given the ease
        const easeProgress = this.ease.getRatio(progress);
        return easeProgress * (this.valueEnd - this.valueStart) + this.valueStart;
    }
}