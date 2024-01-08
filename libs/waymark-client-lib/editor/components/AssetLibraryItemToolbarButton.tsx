// Vendor
import { css, cx as emotionClassNames } from '@emotion/css';

// Shared
import { WaymarkButton, WaymarkButtonProps } from 'shared/components/WaymarkButton';

// Styles
import { lightCoolGrayColor } from 'styles/themes/waymark/colors.js';

interface AssetLibraryItemToolbarButtonProps extends WaymarkButtonProps {
  className?: string;
  onClick?: () => void;
}

/**
 * Renders a pre-styled button which can be rendered in the asset's action toolbar.
 * @param {string} className - Class name to apply additional custom styles to the button element
 * @param {func} onClick - Callback to run when the button is clicked
 */
export const AssetLibraryItemToolbarButton = ({
  className = undefined,
  onClick = undefined,
  ...props
}: AssetLibraryItemToolbarButtonProps) => (
  <>
    <div
      className={css`
        &:not(:first-child) {
          /* Render a separator line above each action button except the first one. */
          width: 100%;
          border-top: solid 1px ${lightCoolGrayColor};
          margin: 6px 0;
        }
      `}
    />
    <WaymarkButton
      onClick={() => onClick?.()}
      hasFill={false}
      isSmall
      colorTheme="Secondary"
      className={emotionClassNames(
        css`
          display: block;
          width: 24px;
          border-radius: 4px !important;

          svg {
            width: 100%;
            height: auto;
          }
        `,
        className,
      )}
      {...props}
    />
  </>
);
