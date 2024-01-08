/**
 * Read a file as a data URL in an awaitable fashion.
 *
 * @param {File} file - The file object to read.
 * @return {string} - The file in a Base4 data URL.
 */
export const readFileAsDataURL = (file) =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
            resolve(reader.result);
        };

        reader.onerror = reject;

        reader.readAsDataURL(file);
    });

/**
 * Read a file as an array buffer in an awaitable fashion.
 *
 * @param {File} file - The file object to read.
 * @return {string} - The file as an array buffer.
 */
export const readFileAsArrayBuffer = (file) =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
            resolve(reader.result);
        };

        reader.onerror = reject;

        reader.readAsArrayBuffer(file);
    });