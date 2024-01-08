import _ from 'lodash';
import EventEmitter from 'eventemitter3';
import Tween from './Tween.js';
import {
    getDotpathValue,
    setDotpathValue
} from './utils.js';

export default class Timeline extends EventEmitter {
    static hookNames = {
        // Fired before properties are rendered by the timeline, useful for setting up the object to be rendered
        // Ex: Objects need to be created, caches cleared
        beforeRender: 'beforeRender',
        // Fired simultaniously with properties being rendered by the timeline, order of operations is NOT guaranteed
        // Ex: Updating an object's property that requires calculation
        rendering: 'rendering',
        // Fired after properties have been updated/rendered by the timeline, ahead of an initial render with the engine
        // Ex: The first Pixi Render, to update bounds, etc.
        propertiesRendered: 'propertiesRendered',
        // Fired after properties have been updated, used for effects and things that are applied to fully updated objects
        // Ex: Motion Blur
        afterPropertiesRender: 'afterPropertiesRender',
        // The final hook in a render cycle. Should really only be used for the very last pixi render
        endRender: 'endRender',
        beforeStart: 'beforeStart',
        beforeStop: 'beforeStop',
        complete: 'complete',
    };

    /**
     * @param      {object}  passedOptions  The options to create a tween
     * @param      {*}  passedOptions.target    What the timeline and its tweens modify
     * @param      {number}  passedOptions.duration       The duration
     */
    constructor(passedOptions) {
        super();
        const options = {
            target: null,
            duration: 0,
            ...passedOptions,
        };
        this.target = options.target;
        this.duration = options.duration;
        this.properties = {};
        this.hooks = {
            [Timeline.hookNames.beforeRender]: [],
            [Timeline.hookNames.rendering]: [],
            [Timeline.hookNames.propertiesRendered]: [],
            [Timeline.hookNames.afterPropertiesRender]: [],
            [Timeline.hookNames.endRender]: [],
            [Timeline.hookNames.beforeStart]: [],
            [Timeline.hookNames.beforeStop]: [],
            [Timeline.hookNames.complete]: [],
        };
        this.isComplete = false;

        /**
         * Child timeline structure
         *
         * {
         *  timeline: Timeline,
         *  startTime: 3
         *  // TODO:
         *  Timescale,
         *  Interpolation,
         * }
         *
         */
        this.timelines = [];
        // eslint-disable-next-line no-underscore-dangle
        this._currentTime = 0;
        this.parent = null;

        // Caching for start time TODO: Break cache somehow?
        // eslint-disable-next-line no-underscore-dangle
        this._startTime = null;
        // Add other cached timeline options
    }

    /**
     * Notify the timeline that the renderer will begin playing. This allows hook listeners to prepare
     * for playback.
     */
    async start() {
        await Promise.all(this.callHooks(Timeline.hookNames.beforeStart));
    }

    /**
     * Notify the timeline that the renderer will stop.
     */
    async stop() {
        await Promise.all(this.callHooks(Timeline.hookNames.beforeStop));
    }

    /**
     * Get the current time for this timeline
     *
     * @return       {number}
     */
    get currentTime() {
        // eslint-disable-next-line no-underscore-dangle
        return this._currentTime;
    }

    /**
     * Sets the time for this and all child timelines
     *
     * @param      {number}  time    The time
     *
     * @return     {number}
     */
    set currentTime(time) {
        // eslint-disable-next-line no-underscore-dangle
        this._currentTime = time;

        if (this.duration && time >= this.duration) {
            this.isComplete = true;
            this.callHooks(Timeline.hookNames.complete);
        } else {
            this.isComplete = false;
        }

        // Update the child timelines' times
        this.timelines.forEach(({
            timeline
        }) => {
            // TODO: Factor in time interpolation and timescale
            // eslint-disable-next-line no-param-reassign
            timeline.currentTime = time - timeline.getStartTime();
        });
    }

    /**
     * Get the current time for this timeline as if it was on the global timeline
     *
     * @return       {number}
     */
    get currentGlobalTime() {
        // eslint-disable-next-line no-underscore-dangle
        return this._currentTime + this.getParentsStartTimeOffset();
    }

    /**
     * Adds a hook to the list of hooks
     *
     * @param      {String}  hookName  The hook name
     * @param      {Function}  hook      The hook
     */
    registerHookCallback(hookName, hook) {
        this.hooks[hookName].push(hook);
    }

    /**
     * Removes the hook from our list of hooks
     *
     * @param      {String}  hookName  The hook name
     * @param      {Function}  hook      The hook
     */
    removeHookCallback(hookName, hook) {
        _.pull(this.hooks[hookName], hook);
    }

    /**
     * Utility function for calling all of the registered hooks of a particular
     * type with the passed arguments
     *
     * @param      {String}  hookName  The hook name
     * @return     {Promise}  A promise that resolves when the hooks are complete
     */
    callHooks(hookName, ...args) {
        if (!this.hooks[hookName]) {
            throw Error('Invalid hook called: ', hookName);
        }

        const hookCalls = this.hooks[hookName].map((hook) => hook(...args));

        let childHookCalls = [...hookCalls];
        this.timelines.forEach(({
            timeline
        }) => {
            childHookCalls = [...childHookCalls, ...timeline.callHooks(hookName, ...args)];
        });

        return [...hookCalls, ...childHookCalls];
    }

    /**
     * Adds a tween.
     *
     * @param      {string}  property
     * The property
     * @param      {Tween||object}  tweenProperties
     * The tween or properties to make a tween instance
     */
    addTween(property, tween) {
        // Create an array if it doesn't exist for this property yet
        if (!this.properties[property]) {
            this.properties[property] = [];
        }

        if (tween instanceof Tween) {
            this.properties[property].push(tween);
            // eslint-disable-next-line no-param-reassign
            tween.timeline = this;
        } else {
            this.properties[property].push(
                new Tween({
                    ...tween,
                    timeline: this,
                }),
            );
        }
        this.properties[property].sort((tweenA, tweenB) => tweenA.endTime - tweenB.endTime);
    }

    /**
     * Get all children of a timeline as a flattened single dimensional array.
     */
    get allChildren() {
        let children = [];
        this.timelines.forEach(({
            timeline
        }) => {
            children = [...children, timeline, ...timeline.allChildren];
        });

        return children;
    }

    /**
     * Adds a timeline.
     *
     * @param      {Timeline}  timeline   The timeline
     * @param      {number}  startTime
     * The time that the child timeline would start on this timeline, offsetting the child's tweens.
     */
    addTimeline(timeline, startTime) {
        // eslint-disable-next-line no-param-reassign
        timeline.parent = this;
        this.timelines.push({
            timeline,
            startTime,
        });
        this.timelines.sort((timelineA, timelineB) => timelineA.startTime - timelineB.startTime);
    }

    /**
     * Get all of the tweens for a specific property to alter on the target
     *
     * @param      {String}  property  The property
     * @return     {Tween[]}  The property tweens.
     */
    getPropertyTweens(property) {
        return this.properties[property] || [];
    }

    /**
     * Gets the options for how this timeline was added to the parent timeline
     *
     * @return     {Object}  The timeline options.
     */
    getTimelineOptions() {
        // TODO: Optimization pass to cache?
        return _.find(this.parent.timelines, {
            timeline: this
        });
    }

    /**
     * Gets the start time for this timeline (stored on its parent)
     *
     * @return     {number}  The start time.
     */
    getStartTime() {
        /* eslint-disable no-underscore-dangle */
        if (!this.parent) {
            return 0;
        }

        if (this._startTime === null) {
            this._startTime = this.getTimelineOptions().startTime;
        }

        return this._startTime;
        /* eslint-disable no-underscore-dangle */
    }

    /**
     * Gets the start time offset by recursively checking start times of its parents
     *
     * @return     {number}  The start time offset.
     */
    getParentsStartTimeOffset() {
        if (this.parent) {
            return this.parent.getStartTime() + this.parent.getParentsStartTimeOffset();
        }
        return 0;
    }

    /**
     * Gets the property value at the global or "root" time.
     *
     * @param      {string}  property  The property
     * @param      {number}  time      The time
     * @return     {*}  The property value at global time.
     */
    getPropertyValueAtGlobalTime(property, time) {
        // We only care about the parent's offsets, because the start time of the current timeline
        // does not affect the position of this timeline's direct tweens
        return this.getPropertyValueAtTime(property, time - this.getParentsStartTimeOffset());
    }

    /**
     * Gets the property value at time.
     *
     * @param      {string}   property      The property
     * @param      {number}   time          The time
     * @return     {*}        The property value at the time.
     */
    getPropertyValueAtTime(property, time) {
        const tweens = this.getPropertyTweens(property);
        // If there are no tweens, grab the property right from the target
        if (!tweens.length) {
            return getDotpathValue(this.target, property);
        }

        const activeTweens = tweens.filter((tween) => tween.isActiveAtTime(time));

        // It is unlikely that we would have more than 1 active tweens given the structure of the Bodymovin code,
        // but there's nothing inherit to the structure of the array of tween properties that would prevent two tweens from overlapping.
        // Currently we just use the one that has the later endTime to determine the tweet that would affect the object.
        if (activeTweens.length) {
            if (activeTweens.length > 1) {
                console.warn(
                    `More than 1 active tweens for object ${
            this.target.name ? this.target.name : this.target
          } property ${property} at time ${time}.`,
                );
            }
            return activeTweens[activeTweens.length - 1].getValueAtTime(time);
        }

        // Otherwise we need to record the value up to the point in time

        // Look for tweens before the time
        const tweensBefore = tweens.filter((tween) => tween.endTime <= time);
        // If we have any, look for the one one with the later endTime, similar to the active tweens.
        if (tweensBefore.length) {
            return tweensBefore[tweensBefore.length - 1].getValueAtTime(time);
        }

        // If there isn't a value available before, we can assume the first tween is the only property we will have
        return tweens[0].getValueAtTime(time);
    }

    /**
     * Sets the properties for the target at the current time and all of its child timelines as well
     */
    setPropertiesAtCurrentTime() {
        const properties = Object.keys(this.properties);
        for (let i = 0; i < properties.length; i += 1) {
            const key = properties[i];

            // TODO: Should this value be cached or managed for performance?
            const value = this.getPropertyValueAtTime(key, this.currentTime);

            setDotpathValue(this.target, key, value);
        }

        for (let i = 0; i < this.timelines.length; i += 1) {
            const {
                timeline
            } = this.timelines[i];
            timeline.setPropertiesAtCurrentTime(timeline.currentTime);
        }
    }

    /**
     * =================================
     * ==== TIME AND RENDER METHODS ====
     * =================================
     */

    /**
     * Helper method the current time and then renders the target's properties
     *
     * @param      {number}  time    The time
     * @return     {Promise}         Promise that resolves on render complete
     */
    async goToTime(time) {
        this.currentTime = time;
        await this.render();
    }

    /**
     * Renders the target's properties at the passed (or current) time
     * And all of the child timelines as well.
     *
     * @param      {nubmer}   time    The to render
     * @return     {Promise}
     */
    async render() {
        await Promise.all(this.callHooks(Timeline.hookNames.beforeRender));

        this.setPropertiesAtCurrentTime();
        await Promise.all(this.callHooks(Timeline.hookNames.rendering));

        await Promise.all(this.callHooks(Timeline.hookNames.propertiesRendered));

        await Promise.all(this.callHooks(Timeline.hookNames.afterPropertiesRender));

        return Promise.all(this.callHooks(Timeline.hookNames.endRender));
    }

    /**
     * =========================
     * ==== CLEANUP METHODS ====
     * =========================
     */

    /**
     * Removes all tweens from the timeline
     */
    removeAllTweens() {
        Object.keys(this.properties).forEach((property) => {
            // Clear out the array
            this.properties[property].length = 0;
            // Delete the property reference
            delete this.properties[property];
        });
    }

    /**
     * Removes all registered hooks from the timeline.
     */
    removeAllHooks() {
        Object.keys(this.hooks).forEach((hookName) => {
            // Clear out the array
            this.hooks[hookName].length = 0;
        });
    }

    /**
     * Removes all timeline content for this and child timelines
     */
    destroy() {
        this.removeAllTweens();
        this.removeAllHooks();
        this.removeAllListeners();
        this.timelines.forEach(({
            timeline
        }) => {
            timeline.destroy();
        });
        this.timelines.length = 0;
    }
}