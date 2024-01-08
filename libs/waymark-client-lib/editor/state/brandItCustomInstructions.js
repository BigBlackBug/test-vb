import {
    create
} from 'zustand';
import produce from 'immer';

export const INSTRUCTIONS_CATEGORY_KEYS = {
    anything: 'anything',
    myBrand: 'myBrand',
    event: 'event',
    jobOpenings: 'jobOpenings',
};

/**
 * Global store manages data for the user's custom instructions provided to the brand it modal
 * We want this to persist globally so we can retain all of the same settings when the user clicks the "remake" button
 */
const useCustomInstructionsStore = create((set) => ({
    // businessInstructions is an object which is keyed on business guids; each value is an object with a
    // selectedUserInstructionsCategoryKey and customUserInstructionsText value for the custom instructions
    // which the user has input for that business
    businessInstructions: {},
    setSelectedUserInstructionsCategoryKey: (businessGUID, categoryKey) =>
        set(
            produce((state) => {
                state.businessInstructions[businessGUID] = state.businessInstructions[businessGUID] || {};
                state.businessInstructions[businessGUID].selectedUserInstructionsCategoryKey = categoryKey;
            }),
        ),
    setCustomUserInstructionsText: (businessGUID, text) =>
        set(
            produce((state) => {
                state.businessInstructions[businessGUID] = state.businessInstructions[businessGUID] || {};
                state.businessInstructions[businessGUID].customUserInstructionsText = text;
            }),
        ),
}));

/**
 * Hook returns an array with the currently selected user instructions category key and a method to set it
 *
 * @param {string}  businessGUID - The business guid for the business whose custom instructions category key we want to get/set
 *
 * @returns {[string, (string) => void]}
 */
export const useSelectedCustomInstructionsCategory = (businessGUID) =>
    useCustomInstructionsStore((store) => [
        store.businessInstructions[businessGUID] ? .selectedUserInstructionsCategoryKey ? ?
        INSTRUCTIONS_CATEGORY_KEYS.anything,
        (categoryKey) => store.setSelectedUserInstructionsCategoryKey(businessGUID, categoryKey),
    ]);

/**
 * Hook returns an array with the current user instructions text and a method to set it
 *
 * @param {string}  businessGUID - The business guid for the business whose custom instructions text we want to get/set
 *
 * @returns {[string, (string) => void]}
 */
export const useCustomInstructionsText = (businessGUID) =>
    useCustomInstructionsStore((store) => [
        store.businessInstructions[businessGUID] ? .customUserInstructionsText ? ? '',
        (text) => store.setCustomUserInstructionsText(businessGUID, text),
    ]);