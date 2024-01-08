// Vendor
import _ from 'lodash';
import {
    createMachine,
    interpret,
    assign
} from 'xstate';
// Local
import GoogleAnalyticsService from 'app/services/GoogleAnalyticsService.js';
import {
    appRoutePaths
} from 'app/constants/urls.js';
import editorEventEmitter from 'editor/utils/editorEventEmitter.js';
import {
    getPercentEditorFieldsEditedMetrics
} from 'editor/utils/percentEditedMetrics.js';

const states = {
    init: 'init',
    // Using the template browser
    browsing: 'browsing',
    // The editor is open but still loading
    editorLoading: 'editorLoading',
    // Has a template open in the editor without any edits
    editorLoaded: 'editorLoaded',
    // Has made edits to the template
    editing: 'editing',
    // Has closed the editor either by clicking the exit or buy button; this trackable
    // session has now been completed
    closedEditor: 'closedEditor',
};

const transitionEvents = {
    // User landed on the template browser page
    OPENED_TEMPLATE_BROWSER: 'OPENED_TEMPLATE_BROWSER',
    // Editor has been initially opened and is loading
    VARIANT_OPENED: 'VARIANT_OPENED',
    USER_VIDEO_OPENED: 'USER_VIDEO_OPENED',
    // Editor has finished loading and is now usable
    EDITOR_LOADED: 'EDITOR_LOADED',
    // The user made an edit to the template
    EDIT_TEMPLATE: 'EDIT_TEMPLATE',
    // The editor was closed via exit button
    CLOSE_EDITOR: 'CLOSE_EDITOR',
    // The editor was closed by clicking the buy button to proceed to checkout
    OPEN_CHECKOUT: 'OPEN_CHECKOUT',
};

// Events which run side effects but don't actually transition the machine to a different state
const internalEvents = {
    // The user video record for the video has loaded
    LOADED_USER_VIDEO: 'LOADED_USER_VIDEO',
    // The variant record for the video has loaded
    LOADED_VARIANT: 'LOADED_VARIANT',
    PERSONALIZED_VIDEO: 'PERSONALIZED_VIDEO',
    // The video has been saved for the first time -- we will grab the user video GUID for analytics
    SAVED_USER_VIDEO: 'SAVED_USER_VIDEO',
    // The template's form description has been loaded so we can use it for computing the % edited metric
    LOADED_FORM_DESCRIPTION: 'LOADED_FORM_DESCRIPTION',
};

const DEFAULT_CONTEXT = {
    browsingStartTime: null,
    firstEditTime: null,
    personalizeStartTime: null,
    finishedEditingTime: null,
    analyticsDimensions: {
        variantSlug: null,
        userVideoGUID: null,
        businessGUID: null,
    },
    initialPersonalizedBusinessGUID: null,
    isEditingExistingDraft: false,
    formDescription: null,
    initialConfiguration: null,
    finalConfiguration: null,
};

// We'll label GA events based on which type of event resulted in the editor being closed
const getEditorMetricEventLabel = ({
        isEditingExistingDraft,
        initialPersonalizedBusinessGUID,
        analyticsDimensions: {
            businessGUID
        },
    },
    event,
) => {
    // Describes why the user's editing session ended
    const endOfEditingSessionReason =
        event.type === transitionEvents.OPEN_CHECKOUT ? 'checkout' : 'exit';

    // Describes whether the user's edit started with a new variant or an existing draft
    const editedVideoType = isEditingExistingDraft ? 'existing_draft' : 'new_video';

    // Describes whether the video's personalized business was changed from when it was loaded for the first time
    const personalizationChangeStatus =
        initialPersonalizedBusinessGUID !== businessGUID ?
        'changed_personalized_business' :
        'no_personalization_changes';

    return `${endOfEditingSessionReason} | ${editedVideoType} | ${personalizationChangeStatus}`;
};

/**
 * Action logs the time_to_starting_point timing metric to Google Analytics when the editor is closed.
 * This metric describes how long the user took from opening the template browser to selecting a variant and making an edit to it.
 *
 * @param {Object} context  Context with various data collected over the session we're tracking which will inform what we log to GA
 * @param {number} [context.browsingStartTime]  The time that the user started using the template browser before opening and editing the video that was just closed
 * @param {number} [context.firstEditTime]  The time that the user made their first edit to the video that was just closed
 * @param {Object} [context.analyticsDimensions]  Object with various values that can be spread onto our analytics event params as additional dimensions for tracking (ie, variant slug, user video guid, business guid)
 * @param {Object} event  Object describes the transition event that led to this action being fired
 */
function logTimeToStartingPointMetric(context, event) {
    const {
        browsingStartTime,
        firstEditTime,
        analyticsDimensions
    } = context;

    if (browsingStartTime !== null && firstEditTime !== null) {
        // Log how much time elapsed from when the user started browsing for templates to when they made their first edit
        const totalTimeToFirstEdit = firstEditTime - browsingStartTime;

        GoogleAnalyticsService.trackTiming('time_to_starting_point', totalTimeToFirstEdit, {
            eventCategory: 'KPI Metrics',
            eventLabel: getEditorMetricEventLabel(context, event),
            ...analyticsDimensions,
        });
    }
}

/**
 * Action logs the time_to_edit timing metric to Google Analytics when the editor is closed
 * This metric describes how long the user took from making their first edit to the video to finishing their editing session.
 *
 * @param {Object} context  Context with various data collected over the session we're tracking which will inform what we log to GA
 * @param {number} [context.firstEditTime]  The time that the user made their first edit to the video that was just closed
 * @param {number} [context.finishedEditingTime]  The time that editor was closed
 * @param {Object} [context.analyticsDimensions]  Object with various values that can be spread onto our analytics event params as additional dimensions for tracking (ie, variant slug, user video guid, business guid)
 * @param {Object} event  Object describes the transition event that led to this action being fired
 */
function logTimeToEditMetric(context, event) {
    const {
        firstEditTime,
        finishedEditingTime,
        analyticsDimensions
    } = context;

    // Log how much time elapsed from when the user made their first edit to now when they closed the editor
    const totalTimeFromFirstEdit = finishedEditingTime - firstEditTime;

    GoogleAnalyticsService.trackTiming('time_to_edit', totalTimeFromFirstEdit, {
        eventCategory: 'KPI Metrics',
        eventLabel: getEditorMetricEventLabel(context, event),
        ...analyticsDimensions,
    });
}

/**
 * Action logs the time_from_personalize_to_completion metric to Google Analytics when the editor is closed
 * This metric describes how long the user took from using auto-personalize on the video to finishing their editing session.
 *
 * @param {Object} context  Context with various data collected over the session we're tracking which will inform what we log to GA
 * @param {number} [context.personalizeStartTime] The time that the user applied auto-personalize to their video
 * @param {number} [context.finishedEditingTime]  The time that editor was closed
 * @param {Object} [context.analyticsDimensions]  Object with various values that can be spread onto our analytics event params as additional dimensions for tracking (ie, variant slug, user video guid, business guid)
 * @param {Object} event  Object describes the transition event that led to this action being fired
 */
function logTimeFromPersonalizeToFinishMetric(context, event) {
    const {
        personalizeStartTime,
        finishedEditingTime,
        analyticsDimensions
    } = context;

    // If the video was personalized, log how much time elapsed from when the user applied auto-personalize to when they finished editing the video
    if (personalizeStartTime !== null) {
        const totalTimeFromPersonalize = finishedEditingTime - personalizeStartTime;

        GoogleAnalyticsService.trackTiming(
            'time_from_personalize_to_completion',
            totalTimeFromPersonalize, {
                eventCategory: 'KPI Metrics',
                eventLabel: getEditorMetricEventLabel(context, event),
                ...analyticsDimensions,
            },
        );
    }
}

/**
 * Action logs the percent_edited_in_editing_session metric to Google Analytics when the editor is closed
 * This metric describes how long the user took from using auto-personalize on the video to finishing their editing session.
 *
 * @param {Object} context  Context with various data collected over the session we're tracking which will inform what we log to GA
 * @param {Object} [context.formDescription]      The form description describing the editable fields in the template
 * @param {number} [context.initialConfiguration] The base "initial" configuration for the video which the user started from
 * @param {number} [context.finalConfiguration]   The final configuration that the video had when the user closed the editor
 * @param {Object} [context.analyticsDimensions]  Object with various values that can be spread onto our analytics event params as additional dimensions for tracking (ie, variant slug, user video guid, business guid)
 * @param {Object} event  Object describes the transition event that led to this action being fired
 */
function logPercentEditedMetric(context, event) {
    const {
        formDescription,
        initialConfiguration,
        finalConfiguration,
        analyticsDimensions
    } =
    context;

    if (formDescription && initialConfiguration && finalConfiguration) {
        const percentEditedFieldStats = getPercentEditorFieldsEditedMetrics(
            formDescription,
            initialConfiguration,
            finalConfiguration,
        );

        GoogleAnalyticsService.trackEvent('percent_edited_in_editing_session', {
            eventCategory: 'KPI Metrics',
            eventLabel: getEditorMetricEventLabel(context, event),
            ...analyticsDimensions,
            ...percentEditedFieldStats,
        });
    }
}

/**
 * State machine tracks how much time the user spends from when they make their first edit on a new
 * video to when they either close the editor or open the checkout page and logs this metric to
 * google analytics.
 *
 * To learn more details, see the xstate docs here: https://xstate.js.org/docs/
 */
const editorTimingMetricTrackingStateMachine = createMachine({
    // The initial state that our machine should be at when we start it
    initial: states.init,
    // Context tracks state values that may be updated as the state machine transitions
    context: DEFAULT_CONTEXT,
    // Defines all states that the machine can be in and how the machine can transition between those states
    states: {
        [states.init]: {
            on: {
                // If the user is opening the template browser, update the state to `browsing` and store
                // the current time as our browsingStartTime in the machine's context
                [transitionEvents.OPENED_TEMPLATE_BROWSER]: {
                    target: states.browsing,
                    // Actions define a list of effects that should be run along with this transition
                    actions: [
                        // Store the time that the template browser was opened in the context
                        assign({
                            browsingStartTime: () => performance.now(),
                        }),
                    ],
                },
                // If the user is opening a variant in the editor, go straight to the `editorLoading` state
                [transitionEvents.VARIANT_OPENED]: states.editorLoading,
                // If the user is opening a user video in the editor, go to the `editorLoading` state and update the
                // context to indicate that we're editing an existing draft
                [transitionEvents.USER_VIDEO_OPENED]: {
                    actions: [
                        assign({
                            isEditingExistingDraft: true,
                        }),
                    ],
                    target: states.editorLoading,
                },
            },
        },
        // The user is on the template browser
        [states.browsing]: {
            on: {
                // If the user opens a variant in the editor from the template browser, transition to the `editorLoading` state
                [transitionEvents.VARIANT_OPENED]: states.editorLoading,
            },
        },
        // The user is in the editor, waiting for the video to load
        [states.editorLoading]: {
            on: {
                // When the video finishes loading, transition to `editorLoaded` state
                [transitionEvents.EDITOR_LOADED]: states.editorLoaded,
                // If the user closes the editor prematurely to return to the template browser, return to `browsing` state
                [transitionEvents.OPENED_TEMPLATE_BROWSER]: states.browsing,
            },
        },
        // The user is in the editor and it has finished loading, but they haven't made any edits yet
        [states.editorLoaded]: {
            on: {
                // If the user makes an edit to the video, transition to `editing` state
                [transitionEvents.EDIT_TEMPLATE]: states.editing,
                // If the user closes the editor to return to the template browser without making any edits, return to `browsing` state and reset any stored context values for
                // this editing session
                [transitionEvents.OPENED_TEMPLATE_BROWSER]: {
                    target: states.browsing,
                    actions: [
                        // Reset any context values that were set for this editing session since the user closed it without making any edits
                        assign({
                            personalizeStartTime: null,
                            analyticsDimensions: DEFAULT_CONTEXT.analyticsDimensions,
                            formDescription: null,
                            initialConfiguration: null,
                        }),
                    ],
                },
            },
        },
        // The user is in the editor and has made edits
        // From this point onward, we'll stay in the `editing` state until the user closes the editor
        [states.editing]: {
            entry: [
                // Upon entering the editing state, update the context with the time when the first edit occurred
                assign({
                    firstEditTime: () => performance.now(),
                }),
            ],
            on: {
                // If the user closed the editor via the "exit" button/back button, transition to `closedEditor` state
                [transitionEvents.CLOSE_EDITOR]: states.closedEditor,
                // If the user closed the editor by clicking the purchase button to proceed to checkout, transition to `closedEditor` state as well
                [transitionEvents.OPEN_CHECKOUT]: states.closedEditor,
            },
        },
        [states.closedEditor]: {
            // Fire off all of our analytics events now that the editing session has completed
            entry: [
                assign({
                    finishedEditingTime: () => performance.now(),
                }),
                logTimeToStartingPointMetric,
                logTimeToEditMetric,
                logTimeFromPersonalizeToFinishMetric,
                logPercentEditedMetric,
            ],
            // closedEditor is a "final" state in the state machine, meaning it can't
            // transition to any other states from here and is therefore done
            type: 'final',
        },
    },
    on: {
        // A UserVideo was initially loaded via opening an existing draft in the editor
        [internalEvents.LOADED_USER_VIDEO]: {
            actions: [
                assign({
                    initialPersonalizedBusinessGUID: (context, event) => event.personalizedBusinessGUID,
                    initialConfiguration: (context, event) => event.userVideoConfiguration,
                    analyticsDimensions: (context, event) => ({
                        ...context.analyticsDimensions,
                        userVideoGUID: event.userVideoGUID,
                        variantSlug: event.variantSlug,
                        businessGUID: event.personalizedBusinessGUID,
                    }),
                }),
            ],
        },
        // A VideoTemplateVariant was initially loaded in the editor
        [internalEvents.LOADED_VARIANT]: {
            actions: [
                assign({
                    initialConfiguration: (context, event) =>
                        // If we already have an initial configuration keep that, otherwise
                        // fall back to the variant's default configuration
                        context.initialConfiguration || event.variantConfiguration,
                    analyticsDimensions: (context, event) => ({
                        ...context.analyticsDimensions,
                        variantSlug: event.variantSlug,
                    }),
                }),
            ],
        },
        // The video was personalized for a business
        [internalEvents.PERSONALIZED_VIDEO]: {
            actions: [
                assign({
                    // Use the personalized configuration as our new baseline "initial configuration"
                    // to compare against when determining how many fields the user edited
                    initialConfiguration: (context, event) => event.personalizedConfiguration,
                    // Store the current time when the video was personalized so we can track
                    // how long the user spent editing the video after personalization
                    personalizeStartTime: () => performance.now(),
                    analyticsDimensions: (context, event) => ({
                        ...context.analyticsDimensions,
                        // Update the current business guid
                        businessGUID: event.personalizedBusinessGUID,
                    }),
                }),
            ],
        },
        // Internal transition doesn't update the state but runs side effects to update the context
        // whenever the video is saved
        [internalEvents.SAVED_USER_VIDEO]: {
            actions: [
                assign({
                    finalConfiguration: (context, event) => event.userVideoConfiguration,
                    // Save the info for the saved user video on our analytics dimensions
                    analyticsDimensions: (context, event) => ({
                        ...context.analyticsDimensions,
                        userVideoGUID: event.userVideoGUID,
                        variantSlug: event.variantSlug,
                    }),
                }),
            ],
        },
        // Internal transition doesn't update the state but updates the context to store
        // the template's form description when it loads
        [internalEvents.LOADED_FORM_DESCRIPTION]: {
            actions: [
                assign({
                    formDescription: (context, event) => event.formDescription,
                }),
            ],
        },
    },
});

// Exporting so we can access this in unit tests
export const editorAnalyticsMetricTracker = interpret(editorTimingMetricTrackingStateMachine);

function startTimeToEditNewVideoTracker() {
    // Don't do anything if the tracker has already been initialized
    if (editorAnalyticsMetricTracker.initialized) return;

    editorAnalyticsMetricTracker.start();

    /* Set up editor event listeners to update state based on things happening in the editor */

    /**
     * `loadedEditorUserVideo` event is fired when the UserVideo being edited has loaded, if applicable
     *
     * @param {Object} userVideo    The user video which has finished loading
     */
    const onLoadedEditorUserVideo = (userVideo) => {
        editorAnalyticsMetricTracker.send({
            type: internalEvents.LOADED_USER_VIDEO,
            variantSlug: userVideo.variantSlug,
            userVideoGUID: userVideo.guid,
            userVideoConfiguration: _.cloneDeep(userVideo.configuration),
            personalizedBusinessGUID: userVideo.personalizedBusinessGUID,
        });
    };
    editorEventEmitter.on('loadedEditorUserVideo', onLoadedEditorUserVideo);

    /**
     * `loadedEditorVariant` event is fired when the VideoTemplateVariant has loaded
     *
     * @param {Object} variant    The template variant which has finished loading
     */
    const onLoadedEditorVariant = (variant) => {
        editorAnalyticsMetricTracker.send({
            type: internalEvents.LOADED_VARIANT,
            variantSlug: variant.slug,
            variantConfiguration: _.cloneDeep(variant.configuration),
        });
    };
    editorEventEmitter.on('loadedEditorVariant', onLoadedEditorVariant);

    /**
     * `editorOpened` event is fired when enough data has loaded for the video that we can
     * fully proceed to open the editor.
     */
    const onEditorLoaded = () => {
        editorAnalyticsMetricTracker.send({
            type: transitionEvents.EDITOR_LOADED,
        });
    };
    editorEventEmitter.on('editorOpened', onEditorLoaded);

    /**
     * `personalizedVideoForBusiness` event is fired when the video's contents
     * have been personalized/"branded" for a given business
     *
     * @param {string} businessGUID   The GUID of the business which the video was personalized for
     */
    const onPersonalizedVideoForBusiness = ({
        businessGUID,
        updatedConfiguration
    }) => {
        editorAnalyticsMetricTracker.send({
            type: internalEvents.PERSONALIZED_VIDEO,
            personalizedBusinessGUID: businessGUID,
            personalizedConfiguration: _.cloneDeep(updatedConfiguration),
        });
    };
    editorEventEmitter.on('personalizedVideoForBusiness', onPersonalizedVideoForBusiness);

    /**
     * `loadedFormDescription` event is fired when the data describing how the editor UI's forms should be
     * configured is loaded. This form description data is used so we can determine how many of the video's fields the
     * user modified in an editing session.
     *
     * @param {Object} formDescription
     */
    const onLoadedFormDescription = (formDescription) => {
        editorAnalyticsMetricTracker.send({
            type: internalEvents.LOADED_FORM_DESCRIPTION,
            formDescription,
        });
    };
    editorEventEmitter.on('loadedFormDescription', onLoadedFormDescription);

    /**
     * `videoEdited` event is fired when the user makes edits to the  (ie, typing in a text field, selecting a different image, etc)
     */
    const onVideoEdited = () => {
        editorAnalyticsMetricTracker.send({
            type: transitionEvents.EDIT_TEMPLATE,
        });
    };
    editorEventEmitter.on('videoEdited', onVideoEdited);

    /**
     * `videoCreated` event is fired when the video in this editing session is saved to the user's account as a UserVideo for the first time.
     *
     * @param {Object} userVideo  Object describing the user video that was created for this editing session
     */
    const onVideoSaved = (userVideo) => {
        editorAnalyticsMetricTracker.send({
            type: internalEvents.SAVED_USER_VIDEO,
            userVideoGUID: userVideo.guid,
            variantSlug: userVideo.variantSlug,
            userVideoConfiguration: userVideo.configuration,
        });
    };
    editorEventEmitter.on('videoSaved', onVideoSaved);

    /**
     * `videoCompleted` event is fired when the user clicks the "buy" button and proceeds to the checkout page.
     *
     * If the video is saved for the first time in this process, the `videoCreated` event will be fired first so our
     * state machine will handle everything as expected.
     */
    const onOpenedCheckout = () => {
        editorAnalyticsMetricTracker.send(transitionEvents.OPEN_CHECKOUT);
    };
    editorEventEmitter.on('videoCompleted', onOpenedCheckout);

    /**
     * `editorExited` event is fired when the user closes the editor. Note that this will fire when opening the checkout page too, but
     * in that case the `videoCompleted` event will have fired first, in which case this won't do anything.
     */
    const onClosedEditor = () => {
        editorAnalyticsMetricTracker.send(transitionEvents.CLOSE_EDITOR);
    };
    editorEventEmitter.on('editorExited', onClosedEditor);

    // When the state machine reaches the final "closedEditor" state, clean up
    // and stop the tracker; we can fire it back up if the user starts editing
    // another template
    // (note that after the machine interpreter is fully stopped, these onDone and onStop listeners will be automatically cleaned up)
    editorAnalyticsMetricTracker.onDone(() => editorAnalyticsMetricTracker.stop());
    editorAnalyticsMetricTracker.onStop(() => {
        // Clean up our event listeners when the tracker stops
        editorEventEmitter.off('loadedEditorUserVideo', onLoadedEditorUserVideo);
        editorEventEmitter.off('loadedEditorVariant', onLoadedEditorVariant);
        editorEventEmitter.off('editorOpened', onEditorLoaded);
        editorEventEmitter.off('personalizedVideoForBusiness', onPersonalizedVideoForBusiness);
        editorEventEmitter.off('loadedFormDescription', onLoadedFormDescription);
        editorEventEmitter.off('videoEdited', onVideoEdited);
        editorEventEmitter.off('videoSaved', onVideoSaved);
        editorEventEmitter.off('videoCompleted', onOpenedCheckout);
        editorEventEmitter.off('editorExited', onClosedEditor);
    });
}

export default {
    /**
     * Method should be called with the app's route path changes so we can
     * check if/how our tracker state machine should be updated
     *
     * @param {string} path   String representing the route path that the user is on
     */
    onAppRoutePathChanged(path) {
        switch (path) {
            case appRoutePaths.templateBrowser:
                // If we're on the template browser or a variant edit page, ensure the tracker is started
                startTimeToEditNewVideoTracker();
                // Indicate that we're starting the flow from the template browser page
                editorAnalyticsMetricTracker.send(transitionEvents.OPENED_TEMPLATE_BROWSER);
                break;
            case appRoutePaths.editVariant:
                startTimeToEditNewVideoTracker();
                // Indicate that we're starting our tracking from a fresh variant opened in the editor
                editorAnalyticsMetricTracker.send(transitionEvents.VARIANT_OPENED);
                break;
            case appRoutePaths.editYourVideo:
                startTimeToEditNewVideoTracker();
                // Indicate that we're starting our tracking from a previously created draft opened in the editor
                editorAnalyticsMetricTracker.send(transitionEvents.USER_VIDEO_OPENED);
                break;
            case appRoutePaths.checkout:
                // If the user is on the checkout page they're still within the valid
                // template browser -> edit -> purchase flow, so keep the tracker going
                break;
            default:
                // Any other routes are breaking from the trackable path, so let's cancel our timer
                editorAnalyticsMetricTracker.stop();
        }
    },
};