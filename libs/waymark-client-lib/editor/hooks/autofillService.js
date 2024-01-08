import {
    useState
} from 'react';

// Editor
import {
    useEditorVideoContext
} from 'editor/providers/EditorVideoProvider.js';
import {
    useEditorDispatch
} from 'editor/providers/EditorStateProvider.js';
import {
    useApplyVideoDescriptorToConfiguration
} from 'editor/hooks/personalization.js';
import {
    showBrandItRatingSurvey
} from 'editor/utils/productTours';
import editorEventEmitter from 'editor/utils/editorEventEmitter.js';
import {
    INSTRUCTIONS_CATEGORY_KEYS
} from 'editor/state/brandItCustomInstructions.js';

// Shared
import AutofillService from 'shared/services/AutofillService.js';
import {
    safeLocalStorage
} from 'shared/utils/safeStorage';

export const BRANDING_STATE = {
    // Branding is unstarted
    init: 'init',
    // Branding is in progress
    inProgress: 'inProgress',
    // Branding has succeeded, fill the progress bar and close the modal
    success: 'success',
    // Branding failed, show an error state
    error: 'error',
};

// Defines how to format the custom instruction text that the user has entered into
// the brand it modal's text input before we pass it to the autofill service.
const customInstructionsTextFormatters = {
    [INSTRUCTIONS_CATEGORY_KEYS.anything]: (businessName, customInstructionsText) =>
        customInstructionsText || null,
    [INSTRUCTIONS_CATEGORY_KEYS.myBrand]: (businessName, customInstructionsText) =>
        `Write a video script introducing ${businessName} using the business context provided.${
      customInstructionsText ? ` Highlight these details: ${customInstructionsText}` : ''
    }`,
    [INSTRUCTIONS_CATEGORY_KEYS.event]: (businessName, customInstructionsText) =>
        `Write a video script to promote an event for ${businessName}${
      customInstructionsText
        ? `, using the following event details: ${customInstructionsText}`
        : '.'
    }`,
    [INSTRUCTIONS_CATEGORY_KEYS.jobOpenings]: (businessName, customInstructionsText) =>
        `Write a video script to promote ${businessName} as an employer${
      customInstructionsText
        ? `, using these specific details about the opportunity: ${customInstructionsText}`
        : '.'
    }`,
};

const BRAND_IT_RUN_COUNT_LOCAL_STORAGE_KEY = 'brandItRunCount';

// When an event is emitted to indicate that the video was successfully peresonalized,
// check to see if we should show the user a rating survey to ask them how satisfied they
// were with the personalized results
editorEventEmitter.on('personalizedVideoForBusiness', () => {
    // Get the number of times brand it has been run so far from local storage if it's available,
    // then increment it by 1 and save it to local storage
    const brandItRunCount =
        (Number(safeLocalStorage.getItem(BRAND_IT_RUN_COUNT_LOCAL_STORAGE_KEY)) || 0) + 1;
    safeLocalStorage.setItem(BRAND_IT_RUN_COUNT_LOCAL_STORAGE_KEY, brandItRunCount);

    // Show a rating survey the first time the user runs brand it, and then every 5 times after that
    if (brandItRunCount % 5 === 1) {
        // Wait 30 seconds before showing the survey
        setTimeout(() => {
            showBrandItRatingSurvey();
        }, 30000);
    }
});

/**
 * Hook returns a method which takes details for a business which we should brand the video with
 * and calls to the autofill service to apply it.
 */
export function useApplyBrandingToVideo() {
    const [brandingState, setBrandingState] = useState(BRANDING_STATE.init);

    /**
     * Resets the branding state to the initial state
     * This should be called after the brand it modal is closed to clear any lingering error/success states
     */
    const resetBrandingState = () => setBrandingState(BRANDING_STATE.init);

    const {
        applyBusiness,
        saveDraft,
        setAppliedAIVoiceOverSpeakerGUID,
        setAppliedAIVoiceOverText
    } =
    useEditorDispatch();
    const {
        editorVariant,
        editorUserVideo
    } = useEditorVideoContext();
    const variantSlug = editorVariant.slug;
    const existingUserVideoGUID = editorUserVideo ? .guid;

    const applyVideoDescriptorToConfiguration = useApplyVideoDescriptorToConfiguration();

    /**
     * Applies branding to the video with custom instructions from the user, if provided
     */
    const applyBrandingToVideo = async (
        businessDetails,
        selectedUserInstructionsCategoryKey,
        userInstructionsText,
    ) => {
        if (!businessDetails) return;

        try {
            setBrandingState(BRANDING_STATE.inProgress);

            const {
                guid: businessGUID,
                businessName
            } = businessDetails;

            const formattedCustomInstructionsText = customInstructionsTextFormatters[
                selectedUserInstructionsCategoryKey
            ](businessName, userInstructionsText);

            // Officially apply the business to the video
            applyBusiness(businessGUID);

            // Information is logged about the Autofill run and associated with the UserVideo record,
            // so we need create one first if this is the first change the user is making
            let userVideoGUID = existingUserVideoGUID;
            if (!userVideoGUID) {
                const createdUserVideo = await saveDraft();
                userVideoGUID = createdUserVideo.guid;
            }

            await AutofillService.requestVideoDescriptor({
                requestSource: AutofillService.REQUEST_SOURCES.editor,
                businessGUID,
                variantSlug,
                userInstructions: formattedCustomInstructionsText,
                userVideoGUID,
                // success callback
                onGenerationSuccess: async (response) => {
                    const {
                        voiceOverScript,
                        videoDescriptor
                    } = response;

                    const updatedConfiguration = await applyVideoDescriptorToConfiguration(
                        videoDescriptor,
                        businessGUID,
                    );

                    const voiceOverScene = voiceOverScript ? .scenes ? .[0];
                    if (voiceOverScene) {
                        setAppliedAIVoiceOverSpeakerGUID(voiceOverScene.speaker ? .id || null);
                        setAppliedAIVoiceOverText(voiceOverScene.voiceOverText || '');
                    }

                    editorEventEmitter.emit('personalizedVideoForBusiness', {
                        businessGUID,
                        updatedConfiguration,
                    });

                    setBrandingState(BRANDING_STATE.success);
                },
                // error callback
                onVideoDescriptorError: () => {
                    // Displays generic error message in modal, user able to retry or dismiss modal
                    setBrandingState(BRANDING_STATE.error);
                },
            });
        } catch (err) {
            console.error('Failed to apply branded configuration to video', err);
            setBrandingState(BRANDING_STATE.error);
        }
    };

    return {
        brandingState,
        applyBrandingToVideo,
        resetBrandingState,
    };
}