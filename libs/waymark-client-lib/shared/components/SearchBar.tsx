// Vendor
import { forwardRef } from 'react';
import { css, cx as emotionClassNames } from '@emotion/css';

// Local
import { WaymarkButton } from 'shared/components/WaymarkButton';
import WaymarkTextInput from 'shared/components/WaymarkTextInput';
import { CloseIcon } from 'app/icons/BasicIcons';
import { SmallSearchIcon } from 'shared/components/Icons.js';

// Styles
import { darkGrayColor } from 'styles/themes/waymark/colors.js';

/**
 * X icon button which clears the search bar's value when clicked
 *
 * @param {func} clearSearch - Clears the search input
 */
const ClearButton = ({ clearSearch }: { clearSearch: () => void }) => (
  <WaymarkButton
    hasFill={false}
    // Clear the text input
    onClick={() => clearSearch()}
    className={emotionClassNames(
      css`
        /* Overriding default Button styles */
        position: absolute !important;
        /* Icon should be placed inside the text input on its right side */
        right: 8px;
        top: 50%;
        transform: translateY(-50%);
        line-height: 1;

        color: ${darkGrayColor};

        svg {
          display: block;
          width: 16px;
          height: auto;
          stroke-width: 2;
        }
      `,
    )}
    tooltipText="Clear"
  >
    <CloseIcon />
  </WaymarkButton>
);

/**
 * Magnifying glass search icon which we show on the right side of the search input
 * when we aren't showing the clear button.
 */
const SearchIcon = () => (
  <SmallSearchIcon
    color={darkGrayColor}
    fieldProps={{
      className: css`
        /* Search icon should be placed inside the text input on its right side */
        position: absolute;
        right: 8px;
        width: 16px;
        height: auto;
        top: 50%;
        transform: translateY(-50%);
      `,
    }}
  />
);

export interface SearchBarProps {
  value: string;
  onChange: (newValue: string) => void;
  clearSearch?: () => void;
  placeholder?: string;
  className?: string;
}

/**
 * Renders a text input pre-styled as a search bar, with nice additional functionality like a clear button.
 * This is a controlled component which requires a `value` prop for the current search input value,
 * and an `onChange` function which can be used to update the value.
 * This allows us to keep things clean and react-y without having to do crazy hacks
 * in order to handle scenarios where the search input's value may need to be changed
 * externally.
 *
 * @param {string}  value - The current value of the search bar (this is required because this has to be a controlled component)
 * @param {func} onChange - Callback fired when the user changes the search bar's value (this should update the state which is being passed to the value prop,
 *                              but may trigger additional search-related side effects as well)
 * @param {func} [clearSearch] - Callback which will clear the search input value when the the search bar's clear button is clicked.
 *                                  If this is not provided, the clear button will not be shown.
 * @param {string} [placeholder="Search"] - Placeholder text to display in the search input
 * @param {string} [className] - Optional custom className to apply additional styling to the search input
 */
function SearchBar(
  {
    value,
    onChange,
    clearSearch = undefined,
    placeholder = 'Search',
    className = '',
  }: SearchBarProps,
  ref: React.ForwardedRef<HTMLInputElement>,
) {
  return (
    <WaymarkTextInput
      ref={ref}
      value={value}
      onChange={(event) => {
        const newValue = (event.target as HTMLInputElement).value;
        onChange(newValue);
      }}
      className={emotionClassNames(
        css`
          position: relative;
          width: 100%;

          input {
            /* Additional 30px on the right side to give space for the search icon */
            padding-right: 30px;
          }
        `,
        className,
      )}
      placeholder={placeholder}
      inputIcon={
        // If the user has typed anything into the search bar and we have a clearSearch callback, show an X button which
        // will clear the search input, otherwise show a magnifying glass icon
        Boolean(value) && clearSearch ? <ClearButton clearSearch={clearSearch} /> : <SearchIcon />
      }
    />
  );
}

export default forwardRef(SearchBar);
