// Vendor
import PropTypes from 'prop-types';

// Shared
import {
    WaymarkButton
} from 'shared/components/WaymarkButton';
import WaymarkModalHeading from 'shared/components/WaymarkModalHeading';
import withWaymarkModal from 'shared/components/WithWaymarkModal';

import * as styles from './EditorLongPressActionModal.css';

/**
 * @typedef {Object}  ActionButtonConfig
 * Config describes how an action button in the modal should behave and appear
 *
 * @property  {func}    action        Function to call when clicking the action button
 * @property  {string}  actionName    Text to display in the action button
 * @property  {object}  [buttonProps] Any additional optional props to apply further customization to the action button
 */

/**
 * @typedef {Object}  ActionModalConfig
 *
 * @property {string} title   Title to display at the top of the modal
 * @property {ActionButtonConfig[]} actions   Array of ActionButtonConfig objects describing each action button to include in the modal
 */

/**
 * Modal contents provide interface for touchscreen users to select/remove
 * a library item after a long press.
 *
 * @param {ActionModalConfig}  actionModalConfig  Config describes how our modal contents should be rendered
 * @param {func}  onCloseModal  Closes the action modal
 */
const EditorLongPressActionModalContents = ({
        actionModalConfig = null,
        onCloseModal
    }) =>
    actionModalConfig ? ( <
        >
        <
        WaymarkModalHeading title = {
            actionModalConfig.title
        }
        subText = {
            actionModalConfig.subText
        }
        titleClassName = {
            styles.ActionModalTitle
        }
        /> {
            actionModalConfig.actions.map((actionButtonConfig) => {
                if (!actionButtonConfig) return null;

                const {
                    action,
                    actionName,
                    buttonProps = {}
                } = actionButtonConfig;

                return ( <
                    WaymarkButton key = {
                        actionName
                    }
                    onClick = {
                        () => {
                            // Run our button action
                            action ? .();
                            // Close the modal
                            onCloseModal();
                        }
                    }
                    className = {
                        styles.ActionModalButton
                    }
                    colorTheme = "Secondary" { ...buttonProps
                    }
                    isDisabled = {!action || Boolean(buttonProps ? .isDisabled)
                    } >
                    {
                        actionName
                    } <
                    /WaymarkButton>
                );
            })
        } <
        />
    ) : null;

EditorLongPressActionModalContents.propTypes = {
    actionModalConfig: PropTypes.shape({
        title: PropTypes.string.isRequired,
        subText: PropTypes.string,
        actions: PropTypes.arrayOf(
            PropTypes.shape({
                action: PropTypes.func.isRequired,
                actionName: PropTypes.string.isRequired,
                // eslint-disable-next-line react/forbid-prop-types
                buttonProps: PropTypes.object,
            }),
        ),
    }),
    onCloseModal: PropTypes.func.isRequired,
};

export default withWaymarkModal()(EditorLongPressActionModalContents);