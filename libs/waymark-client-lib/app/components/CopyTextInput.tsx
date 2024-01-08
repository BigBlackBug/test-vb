// Vendor
import { useRef } from 'react';
import { css } from '@emotion/css';

// Local
import WaymarkTextInput, { BaseWaymarkTextInputProps } from 'shared/components/WaymarkTextInput';
import { WaymarkButton } from 'shared/components/WaymarkButton';
import { useClipboard } from 'app/hooks/clipboard.js';

import { useTypography } from 'styles/hooks/typography.js';

interface CopyTextInputProps extends BaseWaymarkTextInputProps {
  copyTextValue: string;
  onCopySuccess?: (() => void) | null;
}

/**
 * Renders a pre-populated text input with a copy button next to it
 * which will copy the text value to the user's clipboard
 *
 * @param {string}      copyTextValue     The text value to populate the text input with and
 *                                          copy to the user's clipboard
 * @param {func}        [onCopySuccess]   Optional callback to call upon a successful copy after clicking the
 *                                          CopyTextButton
 * @param {string|node} [label]           Label to display above the text input
 */
const CopyTextInput = ({
  copyTextValue,
  onCopySuccess = null,
  label = null,
  className,
  ...props
}: CopyTextInputProps) => {
  const [headlineTextStyle] = useTypography(['headline']);

  const copyButtonRef = useRef<HTMLButtonElement>(null);

  useClipboard(copyButtonRef, onCopySuccess);

  return (
    <div className={className}>
      {/* Not using WaymarkTextInput's built-in label prop because it will mess up the
          copy button's height */}
      {label && (
        <div
          className={css`
            ${headlineTextStyle}

            display: block;
            margin-bottom: 6px;
            transition: color 0.2s ease-in-out;
          `}
        >
          {label}
        </div>
      )}
      <div
        className={css`
          display: flex;
        `}
      >
        <WaymarkTextInput
          value={copyTextValue}
          // Auto-select the text when the user clicks into the input
          onFocus={(event) => event.target.select()}
          readOnly
          className={css`
            flex: 1;
          `}
          {...props}
        />
        <WaymarkButton
          ref={copyButtonRef}
          data-clipboard-text={copyTextValue}
          className={css`
            margin-left: 6px;
          `}
          colorTheme="Secondary"
          isSmall
        >
          COPY
        </WaymarkButton>
      </div>
    </div>
  );
};

export default CopyTextInput;
