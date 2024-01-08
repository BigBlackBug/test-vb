// Vendor
import {
    createContext,
    useEffect,
    useState,
    useRef,
    useContext
} from 'react';

// Editor
import EditorLongPressActionModal from 'editor/components/EditorLongPressActionModal.js';

// Shared
import sharedPropTypes from 'shared/components/propTypes/index.js';

// Long press actions should be cancelled if the user moves their thumb by a distance greater than this threshold
const TOUCH_MOVE_PIXEL_THRESHOLD = 10;

const EditorLongPressModalContext = createContext();
export const useEditorLongPressModal = () => useContext(EditorLongPressModalContext);

/**
 * Provides an interface for opening an action modal for an editor library asset after
 * a mobile user performs a long press on it
 */
export default function EditorLongPressModalProvider({
    children
}) {
    const [selectedLongPressActionConfig, setLongPressActionConfig] = useState(null);
    const [isLongPressActionModalOpen, setIsLongPressActionModalOpen] = useState(false);

    const touchStartPositionRef = useRef(null);

    useEffect(() => {
        if (selectedLongPressActionConfig) {
            const onTouchMove = (event) => {
                const {
                    clientX,
                    clientY
                } = event.touches[0];

                // Check if the user moved their touch past a certain threshold and we should therefore
                // cancel the long press action
                if (
                    touchStartPositionRef.current &&
                    // Use the distance formula of x^2 + y^2 = d^2 to determine if the touch has moved beyond our distance threshold
                    (clientX - touchStartPositionRef.current.x) ** 2 +
                    (clientY - touchStartPositionRef.current.y) ** 2 >
                    TOUCH_MOVE_PIXEL_THRESHOLD ** 2
                ) {
                    setLongPressActionConfig(null);
                }
            };

            window.addEventListener('touchmove', onTouchMove);

            // If the user holds their touch on the same item for half a second, open the long press action modal
            const timeoutId = setTimeout(() => {
                setIsLongPressActionModalOpen(true);
                window.removeEventListener('touchmove', onTouchMove);
            }, 500);

            return () => {
                // Clear the timeout whenever the selected action config changes
                clearTimeout(timeoutId);
                window.removeEventListener('touchmove', onTouchMove);
            };
        }

        return undefined;
    }, [selectedLongPressActionConfig]);

    const onItemTouchStart = (event, longPressActionConfig) => {
        // If the modal is already open, don't do anything
        if (isLongPressActionModalOpen) return;

        // Hang onto this initial touch position so we can cancel the long press if the
        // user moves their finger too far from this point
        const {
            clientX,
            clientY
        } = event.touches[0];

        touchStartPositionRef.current = {
            x: clientX,
            y: clientY,
        };

        setLongPressActionConfig(longPressActionConfig);
    };

    const onItemTouchEnd = (event) => {
        if (isLongPressActionModalOpen) {
            // If the long press action modal has been opened, prevent the touch action
            // from doing its default behavior
            event.preventDefault();
        } else if (selectedLongPressActionConfig) {
            // If the press action wasn't long enough to trigger the long press modal, reset our config
            setLongPressActionConfig(null);
        }
    };

    return ( <
        EditorLongPressModalContext.Provider value = {
            {
                onItemTouchStart,
                onItemTouchEnd,
            }
        } >
        {
            children
        } <
        EditorLongPressActionModal actionModalConfig = {
            selectedLongPressActionConfig
        }
        isVisible = {
            isLongPressActionModalOpen
        }
        onCloseModal = {
            () => setIsLongPressActionModalOpen(false)
        }
        cancelInterface = "text" /
        >
        <
        /EditorLongPressModalContext.Provider>
    );
}
EditorLongPressModalProvider.propTypes = {
    children: sharedPropTypes.children.isRequired,
};