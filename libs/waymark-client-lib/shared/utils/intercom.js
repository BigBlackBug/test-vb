/**
 * Safely makes a call to the Intercom API. Example usages include
 */
export default function Intercom(...args) {
    if (window.Intercom !== undefined) {
        try {
            window.Intercom(...args);
        } catch (err) {
            console.error(err);
        }
    }
}