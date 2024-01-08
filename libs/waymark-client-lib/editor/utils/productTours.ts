// Shared
import Intercom from 'shared/utils/intercom.js';
import { safeLocalStorage } from 'shared/utils/safeStorage';

const BRAND_PROFILE_ONBOARDING_TOUR_ID = 319415;

/**
 * Starts an intercom product tour to introduce the new Brand Profile feature.
 * This tour should only be shown to the user once; afterwards we'll store that
 * they've seen it in localStorage and skip showing it again
 */
export function showBrandProfileOnboardingTour() {
  if (!safeLocalStorage.getItem('hasShownBusinessProfileOnboardingTour')) {
    // If the local storage doesn't indicate that the the user has seen the
    // intercom business profile onboarding tour yet, start it up for the user
    Intercom('startTour', BRAND_PROFILE_ONBOARDING_TOUR_ID);

    // Update local storage to indicate that the user has now seen the tour
    safeLocalStorage.setItem('hasShownBusinessProfileOnboardingTour', 'true');
  }
}

const AI_VO_ONBOARDING_TOUR_ID = 399862;

/**
 * Starts an intercom product tour to introduce the new AI VO feature.
 */
export function showAIVOOnboardingTour() {
  if (!safeLocalStorage.getItem('hasShownAIVOOnboardingTour')) {
    // If the local storage doesn't indicate that the the user has seen the
    // intercom AI VO onboarding tour yet, start it up for the user
    Intercom('startTour', AI_VO_ONBOARDING_TOUR_ID);

    // Update local storage to indicate that the user has now seen the tour
    safeLocalStorage.setItem('hasShownAIVOOnboardingTour', 'true');
  }
}

const BRAND_IT_RATING_SURVEY_ID = 25968429;

/**
 * Opens an intercom survey to ask the user to rate their experience with "brand it" video generation
 * Note that if we want to stop showing this survey, we can disable it in the intercom dashboard;
 * this method will just gracefully fail to open the survey.
 */
export function showBrandItRatingSurvey() {
  try {
    Intercom('startSurvey', BRAND_IT_RATING_SURVEY_ID);
  } catch (err) {
    console.error('Failed to open Brand It rating survey:', err);
  }
}
