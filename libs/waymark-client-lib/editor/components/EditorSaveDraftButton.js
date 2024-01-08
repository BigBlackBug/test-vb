// Vendor
import PropTypes from 'prop-types';
import classNames from 'classnames';

// Editor
import {
    useEditorState,
    useEditorDispatch,
    SAVE_DRAFT_STATES,
} from 'editor/providers/EditorStateProvider.js';

// Shared
import {
    RotatingLoader
} from '@libs/shared-ui-components';
import {
    CheckMarkIcon
} from 'app/icons/BasicIcons';
import keyCodes from 'shared/utils/keyCodes.js';
import {
    WaymarkButton
} from 'shared/components/WaymarkButton';

/* WAYMARK APP DEPENDENCIES */
import useWindowEvent from 'app/hooks/windowEvent.js';
/* END WAYMARK APP DEPENDENCIES */

import * as styles from './EditorSaveDraftButton.css';

/**
 * Renders save button that saves any unsaved changes for the video being edited
 * @param {object} props - Component props
 * @param {boolean} [props.isDisabled] - Whether the button should be disabled
 * @param {string | null} [props.className] - Additional class names to apply to the button
 */
const EditorSaveDraftButton = ({
    isDisabled = false,
    className = null
}) => {
    const {
        saveDraft
    } = useEditorDispatch();
    const {
        saveDraftState
    } = useEditorState();

    // If the user hits "cmd+s" (or "ctrl+s" on windows/linux), save the video
    const onKeyPress = (event) => {
        if (
            // Check if "s" key is pressed
            event.which === keyCodes.S &&
            // Check if cmd key on mac (metaKey) or ctrl key on windows/linux (ctrlKey) is pressed
            (event.metaKey || event.ctrlKey)
        ) {
            // Prevent default browser action
            event.preventDefault();
            // Save the draft
            saveDraft();
        }
    };

    useWindowEvent('keydown', onKeyPress);

    return ( <
        WaymarkButton colorTheme = "BlackText"
        analyticsAction = "selected_save_draft"
        hasFill = {
            false
        }
        isSmall className = {
            classNames(styles.SaveButton, className)
        }
        isDisabled = {
            isDisabled
        }
        onClick = {
            saveDraft
        } { ...styles.dataSaveDraftState(saveDraftState)
        }
        data - testid = "editorSaveButton" >
        {
            `Save${saveDraftState === SAVE_DRAFT_STATES.saved ? 'd' : ''}`
        } <
        RotatingLoader className = {
            styles.SavingLoadIcon
        }
        /> <
        CheckMarkIcon className = {
            styles.SuccessCheckIcon
        }
        /> <
        /WaymarkButton>
    );
};
EditorSaveDraftButton.propTypes = {
    isDisabled: PropTypes.bool,
    className: PropTypes.string,
};

export default EditorSaveDraftButton;