import zlib from 'zlib';

/**
 * Compress a JSON object into a base64 gzipped string.
 * @param  {Object} jsonData   The JSON to compress.
 */
export const jsonToBase64 = (jsonData) => {
    const jsonString = JSON.stringify(jsonData);
    const gzippedString = zlib.gzipSync(jsonString, {
        level: 9
    });
    const base64String = Buffer.from(gzippedString).toString('base64');

    return base64String;
};

/**
 * Decompress a JSON object from a base64 gzipped string.
 * @param  {Object} jsonData   The JSON to compress.
 */
export const base64ToJson = (base64String) => {
    const gzippedString = Buffer.from(base64String, 'base64');
    const jsonString = zlib.gunzipSync(gzippedString);
    const jsonData = JSON.parse(jsonString);

    return jsonData;
};