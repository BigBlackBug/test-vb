// Vendor
import $script from 'scriptjs';

// Local
import RuntimeConfig from 'shared/utils/RuntimeConfig.js';

/**
 * Singleton helper for interacting with the Stripe javascript API.
 * NOTE: Relies on the inclusion of the stripe `publishableKey` in our RuntimeConfig.
 */
class StripeService {
    constructor() {
        this.Stripe = null;

        $script('https://js.stripe.com/v2/', () => {
            /* eslint-disable-next-line prefer-destructuring */
            this.Stripe = window.Stripe;
            this.Stripe.setPublishableKey(RuntimeConfig.getConfig('stripe').publishableKey);
        });
    }

    /**
     * Validate the provided credit card information with stripe.
     * @param  {object} creditCardInfo  { cardNumber, cardExpiryMonth, cardExpiryYear, cardCVV }
     * @return {Promise}  resolve => stripeToken
     *                    reject => response error
     */
    validateCardInfo(creditCardInfo) {
        const createTokenPayload = {
            number: creditCardInfo.cardNumber,
            exp_month: creditCardInfo.cardExpiryMonth,
            exp_year: creditCardInfo.cardExpiryYear,
            cvc: creditCardInfo.cardCVV,
        };

        return new Promise((resolve, reject) => {
            this.Stripe.card.createToken(createTokenPayload, (status, response) => {
                if (response.error) {
                    reject(response.error);
                } else {
                    resolve(response.id);
                }
            });
        });
    }
}

export default new StripeService();