// Vendor
import {
    useState
} from 'react';
import PropTypes from 'prop-types';
import {
    css
} from '@emotion/css';

// Editor
import {
    useEditorDispatch
} from 'editor/providers/EditorStateProvider.js';
import {
    removeBusinessProfileModalCopy
} from 'editor/constants/modalCopy.js';

// Shared
import {
    WaymarkButton
} from 'shared/components/WaymarkButton';
import withWaymarkModal from 'shared/components/WithWaymarkModal';
import WaymarkModalHeading from 'shared/components/WaymarkModalHeading';

/**
 * Contents for the confirmation modal to show before removing a business profile
 */
function RemoveBusinessConfirmationModalContents({
    onCloseModal
}) {
    const {
        unapplyBusiness
    } = useEditorDispatch();

    const removeBusiness = () => {
        // Clear the applied business
        unapplyBusiness();
        // Close the modal
        onCloseModal();
    };

    return ( <
        >
        <
        WaymarkModalHeading title = {
            removeBusinessProfileModalCopy.title
        }
        subText = {
            removeBusinessProfileModalCopy.subText
        }
        /> <
        WaymarkButton colorTheme = "Negative"
        onClick = {
            removeBusiness
        }
        className = {
            css `
          width: 100%;
        `
        } >
        Remove <
        /WaymarkButton> <
        />
    );
}
RemoveBusinessConfirmationModalContents.propTypes = {
    onCloseModal: PropTypes.func.isRequired,
};

const RemoveBusinessConfirmationModal = withWaymarkModal()(RemoveBusinessConfirmationModalContents);

/**
 * "Remove" button opens a confirmation modal and removes the currently applied business
 * if the user confirms
 */
export default function RemoveBusinessProfileButton({
    className
}) {
    const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);

    return ( <
        div className = {
            className
        } >
        <
        WaymarkButton onClick = {
            () => setIsConfirmationModalOpen(true)
        }
        colorTheme = "NegativeText"
        hasFill = {
            false
        }
        isSmall >
        Remove <
        /WaymarkButton> <
        RemoveBusinessConfirmationModal isVisible = {
            isConfirmationModalOpen
        }
        onCloseModal = {
            () => setIsConfirmationModalOpen(false)
        }
        cancelInterface = "text" /
        >
        <
        /div>
    );
}
RemoveBusinessProfileButton.propTypes = {
    className: PropTypes.string,
};
RemoveBusinessProfileButton.defaultProps = {
    className: '',
};