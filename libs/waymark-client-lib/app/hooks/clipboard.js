// Vendor
import {
    useEffect
} from 'react';
import Clipboard from 'clipboard';

/**
 * Hook that instantiates and destroys a Clipboard instance. Also optionally
 * fires a success callback.
 *
 * @param {ref}  clipboardRef    Ref used to attach Clipboard to a DOM element.
 * @param {func} [onCopySuccess] Optional callback function.
 */
/* eslint-disable-next-line import/prefer-default-export */
export const useClipboard = (clipboardRef, onCopySuccess) => {
    useEffect(() => {
        // Set up a clipboard which will allow us to copy the text when the button is clicked
        const clipboard = new Clipboard(clipboardRef.current);

        if (onCopySuccess) {
            // On copy success, call the onCopySuccess callback
            clipboard.on('success', onCopySuccess);
        }

        return () => {
            // Destroy the clipboard when the component unmounts
            clipboard.destroy();
        };
    }, [clipboardRef, onCopySuccess]);
};