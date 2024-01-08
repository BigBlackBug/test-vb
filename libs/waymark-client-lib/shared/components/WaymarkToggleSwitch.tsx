// Vendor
import { css } from '@emotion/css';

// Styles
import { dropShadows, themeVars } from '@libs/shared-ui-styles';

// Local
import { WaymarkButton, WaymarkButtonProps } from 'shared/components/WaymarkButton';

interface WaymarkToggleSwitchProps extends Omit<WaymarkButtonProps, 'onClick'> {
  isChecked: boolean;
  onToggleChecked?: (event: React.MouseEvent) => void;
  isInProgress: boolean;
}

/**
 * WaymarkButton styled as a toggle switch
 */
export default function WaymarkToggleSwitch({
  isChecked,
  onToggleChecked,
  isInProgress,
  ...props
}: WaymarkToggleSwitchProps) {
  const { disabled } = props;

  return (
    <WaymarkButton onClick={onToggleChecked} hasFill={false} isUppercase={false} {...props}>
      <div
        data-is-checked={isChecked}
        data-is-in-progress={isInProgress}
        data-is-disabled={disabled}
        className={css`
          background: ${themeVars.color.surface._36};
          border-radius: 16px;
          width: 42px;
          height: 24px;
          position: relative;
          transition: background 0.25s;

          &:before {
            content: '';
            display: block;
            background: ${themeVars.color.white};
            border-radius: 50%;
            width: 18px;
            height: 18px;
            position: absolute;
            top: 3px;
            left: 4px;
            transition: left 0.25s;
            box-shadow: ${dropShadows.small};
          }

          &[data-is-checked='true'] {
            background: ${themeVars.color.brand.default};

            &:before {
              left: 20px;
            }
          }

          &[data-is-in-progress='true'] {
            &:before {
              left: 20px;
            }
          }

          &[data-is-disabled='true'] {
            cursor: default;
          }
        `}
      />
    </WaymarkButton>
  );
}
