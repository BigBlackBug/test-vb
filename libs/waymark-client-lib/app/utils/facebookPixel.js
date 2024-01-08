/**
 * Track a Facebook Pixel event, if possible. Note that window.fbq is only initialized
 * right now for the prod environment.
 *
 * @param  {string}  eventName   Event name
 * @param  {object}  payload={}  Event payload
 */
// eslint-disable-next-line import/prefer-default-export
export const trackFacebookPixelEvent = (eventName, payload = {}) => {
    if (window.fbq) {
        window.fbq('track', eventName, payload);
    }
};