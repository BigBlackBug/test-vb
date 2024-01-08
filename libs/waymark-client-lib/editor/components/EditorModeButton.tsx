// Vendor
import { useCallback } from 'react';

import classNames from 'classnames';
import { css } from '@emotion/css';

// Local
import { useEditorPanelDispatch } from 'editor/providers/EditorPanelProvider';

/* WAYMARK APP DEPENDENCIES */
import { WaymarkButton, WaymarkButtonProps } from 'shared/components/WaymarkButton';
import { ArrowRightIcon } from 'shared/components/Icons.js';
/* END WAYMARK APP DEPENDENCIES */

// Styles
import { useTypography } from 'styles/hooks/typography.js';
import { whiteColor, coolGrayColor } from 'styles/themes/waymark/colors.js';
import { EditorPanelKey } from 'editor/constants/Editor';

interface EditorModeButtonProps extends WaymarkButtonProps {
  /**
   * The target mode to open when this button is clicked - optional so that its functionality
   * can be overriden with an optional onCick prop.
   */
  targetMode?: EditorPanelKey | null;
  /**
   * The primary large text for the name of the mode this will switch the editor to
   */
  primaryText: string | React.ReactNode;
  /**
   * The smaller sub text that gives additional info about the mode this will switch to
   */
  subText?: string;
  /**
   * The icon to place on the right side of the button
   */
  icon?: React.ReactNode;
}

/**
 * A button used in the EditorMainControls for changing the editor mode
 */
const EditorModeButton = ({
  targetMode = null,
  onClick,
  primaryText,
  subText = '',
  colorTheme = 'Secondary',
  icon = <ArrowRightIcon />,
  analyticsAction = targetMode ? `selected_${targetMode}_mode` : null,
  className,
  ...props
}: EditorModeButtonProps) => {
  const { openControlPanel } = useEditorPanelDispatch();

  // Sets the editor mode to this buttons's target mode when clicked
  const onClickModeButton = useCallback(
    (event) => {
      onClick?.(event);
      if (targetMode) {
        openControlPanel(targetMode);
      }
    },
    [openControlPanel, targetMode, onClick],
  );

  const [headlineTextStyle, caption3TextStyle] = useTypography(['headline', 'caption3']);

  return (
    <WaymarkButton
      data-is-small={Boolean(subText)}
      className={classNames(
        css`
          display: flex;
          align-items: center;
          justify-content: space-between;
          text-align: left !important;
          width: 100%;
          margin-bottom: 12px;
          border-radius: 12px !important;

          & > svg {
            width: 24px;
            height: auto;
          }
        `,
        className,
      )}
      colorTheme={colorTheme}
      onClick={onClickModeButton}
      analyticsAction={analyticsAction}
      isUppercase={false}
      {...props}
    >
      <div className={headlineTextStyle}>
        {primaryText}
        {subText ? (
          <div
            className={classNames(
              css`
                ${caption3TextStyle}
                color: ${colorTheme === 'AI' ? whiteColor : coolGrayColor};
                margin: 6px 0 2px;
              `,
            )}
          >
            {subText}
          </div>
        ) : null}
      </div>
      {icon}
    </WaymarkButton>
  );
};

export default EditorModeButton;
