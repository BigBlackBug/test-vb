/**
 * Create a promise that resolves after a given time.
 *
 * @param {int} timeout - The number of milliseconds to wait before resolving.
 */
export const createTimerPromise = (timeout) =>
    new Promise((resolve) => setTimeout(resolve, timeout));

/**
 * Waits for a predicate function to return truthy, with an optional timeout.
 *
 * Note: Multiple callees using the same predicate will be released in an
 * arbitrary order due to the polling implementation used by this method.
 *
 * @param {Function} predicate - A function that, when evaluating to a truthy value, will cause the
 *                               Promise to resolve.
 * @param {object} [options]
 * @param {object} [options.pollingInterval=100] - The interval at which to poll the predicate (in milliseconds).
 * @param {object} [options.pollingInterval=8000] - The timeout at which to reject the Promise if the predicate has yet
 *                                                  to evaluate as true (in milliseconds).
 *
 */
export const waitFor = async (predicate, options) => {
    const mergedOptions = {
        pollingInterval: 100,
        timeout: 8000,
        ...options,
    };

    const startTime = new Date();

    const waitingFor = new Promise((resolve, reject) => {
        (function waitForPredicate() {
            // If our predicate is truthy, let's resolve
            const predicateResult = predicate();
            if (predicateResult) {
                resolve(predicateResult);
                return;
            }

            // If we've timed out, let's reject
            const timeElapsed = Math.round(new Date() - startTime);
            if (timeElapsed > mergedOptions.timeout) {
                reject(new Error('Promise timed out.'));
                return;
            }

            // Otherwise, let's do it again in `pollingInterval` number of milliseconds
            setTimeout(waitForPredicate, mergedOptions.pollingInterval);
        })();
    });

    return waitingFor;
};