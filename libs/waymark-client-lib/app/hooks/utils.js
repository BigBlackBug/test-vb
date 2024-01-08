// Vendor
import _ from 'lodash';
import {
    useRef,
    useEffect,
    useMemo
} from 'react';
import {
    useQuery
} from '@apollo/client';
import {
    queryStatus
} from 'app/constants/queryStatus.js';

/**
 * A handy utility hook which allows us to hang onto a reference to what a given variable's
 * value was in the last render
 *
 * Pulled from https://usehooks.com/usePrevious/
 */
export const usePrevious = (value) => {
    // The ref object is a generic container whose current property is mutable
    // and can hold any value, similar to an instance property on a class
    const ref = useRef();

    // Store current value in ref
    useEffect(() => {
        ref.current = value;
    }, [value]); // Only re-run if value changes

    // Return previous value (happens before update in useEffect above)
    return ref.current;
};

/**
 * Development util hook helps you determine whether using the `useMemo` hook will have worthwhile performance benefits.
 * To use, simply use this in place of a `useMemo` hook, use the app normally, and then check the console logs to see the results.
 *
 * @param {func} memoCallback   The callback function whose results we want to memoize
 * @param {Array} dependencies  Dependencies array to pass to the useMemo hook
 * @param {string} label        Label to display when logging performance info for this hook
 *
 * @returns The result returned from the memoCallback
 *
 * @example
 * // Functionally equivalent to `const expensiveComputedValue = useMemo(()=>{...}, [...]);`
 * const expensiveComputedValue = useShouldIUseMemo(()=>{...}, [...]);
 */
export const useShouldIUseMemo = (memoCallback, dependencies, label = 'useShouldIUseMemo') => {
    const numTimesCalledRef = useRef(0);

    const averageMemoizedTimeRef = useRef(0);
    const averageMemoizedTimeWithoutFirstRef = useRef(0);
    const averageUnmemoizedTimeRef = useRef(0);

    numTimesCalledRef.current += 1;

    const currentNumTimesCalled = numTimesCalledRef.current;

    // Run the `useMemo` hook and measure how long it takes
    const memoizedStartTime = performance.now();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const memoizedResult = useMemo(memoCallback, dependencies);
    const memoizedEndTime = performance.now();

    const memoizedTotalTime = memoizedEndTime - memoizedStartTime;

    // Add to our running average for how long the memoized calculation takes
    averageMemoizedTimeRef.current +=
        (memoizedTotalTime - averageMemoizedTimeRef.current) / currentNumTimesCalled;

    const currentAverageMemoizedTime = averageMemoizedTimeRef.current;

    if (currentNumTimesCalled > 1) {
        // Keep a secondary running average of how long the memoized calculation takes excluding its first run.
        // This can help demonstrate the performance benefits for subsequent renders even if the first run is slower.
        averageMemoizedTimeWithoutFirstRef.current +=
            (memoizedTotalTime - averageMemoizedTimeWithoutFirstRef.current) /
            (currentNumTimesCalled - 1);
    }

    const currentAverageMemoizedTimeWithoutFirst = averageMemoizedTimeWithoutFirstRef.current;

    // Run the callback without memoizing it and measure how long it takes
    const unmemoizedStartTime = performance.now();
    const unmemoizedResult = memoCallback();
    const unmemoizedEndTime = performance.now();

    const unmemoizedTotalTime = unmemoizedEndTime - unmemoizedStartTime;

    // Add to our running average for how long the un-memoized calculation takes
    averageUnmemoizedTimeRef.current +=
        (unmemoizedTotalTime - averageUnmemoizedTimeRef.current) / currentNumTimesCalled;

    const currentAverageUnmemoizedTime = averageUnmemoizedTimeRef.current;

    // If the memoized and un-memoized results are different, log an error to warn that something isn't working correctly
    if (!_.isEqual(unmemoizedResult, memoizedResult)) {
        console.error(
            "That's weird. useMemo returned a different value than expected. Please double-check that your dependencies array is correct.",
        );
    }

    // Start a console group and log all of the performance info we gathered for this render
    // eslint-disable-next-line no-console
    console.group(`${label} | render #${currentNumTimesCalled}`);
    // Log the run times for this render and the new averages
    // eslint-disable-next-line no-console
    console.log(
        `MEMOIZED TIME: ${memoizedTotalTime}ms | new total average: ${currentAverageMemoizedTime}ms${
      currentNumTimesCalled > 1
        ? ` | new total average excluding first render: ${currentAverageMemoizedTimeWithoutFirst}ms`
        : ''
    }`,
    );
    // eslint-disable-next-line no-console
    console.log(
        'UN-MEMOIZED TIME:',
        `${unmemoizedTotalTime}ms | new average: ${currentAverageUnmemoizedTime}ms`,
    );

    // Looking at the collected average times, log out a recommendation for whether we should
    // use useMemo or not
    if (currentAverageMemoizedTime < currentAverageUnmemoizedTime) {
        // If the average memoized time is faster than the average un-memoized time, we should definitely use useMemo
        // eslint-disable-next-line no-console
        console.log(
            `You should use useMemo for this. useMemo is on average ${
        100 * (1 - currentAverageMemoizedTime / currentAverageUnmemoizedTime)
      }% faster.`,
        );
    } else if (
        currentNumTimesCalled > 1 &&
        currentAverageMemoizedTimeWithoutFirst < currentAverageUnmemoizedTime
    ) {
        // If the overall average memoized time is slower but the average times excluding the first run are still faster,
        // it's a little harder to strongly endorse using useMemo, but it's certainly worth considering
        // eslint-disable-next-line no-console
        console.log(
            `Although the first run is slower, subsequent runs are on average ${
        100 * (1 - currentAverageMemoizedTimeWithoutFirst / currentAverageUnmemoizedTime)
      }% faster with useMemo. You should consider using useMemo, especially if this component will re-render a lot.`,
        );
    } else {
        // If the average un-memoized time is just straight up faster, we shouldn't use useMemo
        // eslint-disable-next-line no-console
        console.log(
            `${
        currentNumTimesCalled > 1
          ? 'You should NOT use useMemo for this.'
          : 'It is hard to make a solid judgement call until we have more data, but useMemo was slower on the first run.'
      } The un-memoized version is on average ${
        100 * (1 - currentAverageUnmemoizedTime / currentAverageMemoizedTime)
      }% faster.`,
        );
    }
    // eslint-disable-next-line no-console
    console.groupEnd();

    return memoizedResult;
};

/**
 * @typedef   {object}  QueryResults
 * @property  {string}  fetchStatus   Current status returned by the query hook (see queryStatus)
 * @property  {string}  errorMessage  The error message if the status is 'error'
 * @property  {object}  queryData     The resultant query data if any
 * @property  {func}    [refetch]     A function that can be used to refetch the query
 */
const getQueryResults = (data, isLoading, error, transformCallback) => {
    // Derive the fetch status from the state returned from useQuery
    let errorMessage = null;
    let fetchStatus = queryStatus.empty;
    let queryData = null;

    if (error) {
        // If the query had an error, set the fetch status and error message accordingly
        fetchStatus = queryStatus.error;
        errorMessage = error.message;
        console.error(`An error occurred during the query: ${errorMessage}`);
    } else if (isLoading) {
        fetchStatus = queryStatus.loading;
    } else if (data) {
        // If the query isn't loading and we have data, it succeeded!
        fetchStatus = queryStatus.success;
        queryData = transformCallback ? transformCallback(data) : data;
    }

    return {
        fetchStatus,
        errorMessage,
        queryData,
    };
};

/**
 * Hook fetches and returns results from a useQuery hook with some extended error handling and
 * data transformation features
 *
 * @param   {DocumentNode} query           The gql query to execute
 * @param   {object}    options             Options to pass to useQuery hook
 * @param   {function}  [transformCallback] A callback that receives the results data that can
 *                                          be used to return a transformed version of the data
 *
 * @returns {QueryResults}
 */
export const useQueryExtended = (query, options, transformCallback) => {
    const {
        loading,
        error,
        data,
        refetch
    } = useQuery(query, options);

    return {
        ...getQueryResults(data, loading, error, transformCallback),
        refetch,
    };
};