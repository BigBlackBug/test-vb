// Vendor
import {
    useEffect,
    useState
} from 'react';
import axios from 'axios';

const defaultPassThroughFormattingFunction = (response) => response;

/**
 * Hook returns the response data returned by making a GET request to a given url
 *
 * @param {string}  requestURL        The url to retrieve a response for
 * @param {func}    formatResponse    Parses/formats the response data for use
 */
const useHttpResponse = (requestURL, formatResponse = defaultPassThroughFormattingFunction) => {
    const [responseValue, setResponseValue] = useState(null);

    useEffect(
        () => {
            if (requestURL) {
                axios.get(requestURL).then((response) => setResponseValue(formatResponse(response.data)));
            }
        },
        // Disabling exhaustive deps because we just never want to make a new request unless the url changes
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [requestURL],
    );

    return responseValue;
};

export default useHttpResponse;