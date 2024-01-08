// Vendor
import PropTypes from 'prop-types';
import {
    css,
    cx as emotionClassNames
} from '@emotion/css';

// Editor
import {
    INSTRUCTIONS_CATEGORY_KEYS
} from 'editor/state/brandItCustomInstructions.js';

// Shared
import {
    WaymarkButton
} from 'shared/components/WaymarkButton';
import WaymarkTextInput from 'shared/components/WaymarkTextInput';
import CrossFadeTransition from 'shared/components/CrossFadeTransition.js';

// WAYMARK APP DEPENDENCIES
import {
    useIsWindowMobile
} from 'app/hooks/windowBreakpoint.js';
import {
    PromoteMyBusinessIcon,
    PromoteEventCalendarIcon,
    PromoteJobListingIcon,
    PromoteOtherIcon,
} from 'app/icons/VideoIcons';

// Styles
import {
    useTypography
} from 'styles/hooks/typography.js';
import breakpoints from 'styles/constants/breakpoints.js';

// Configs define the copy we should display for each instruction category option
const INSTRUCTIONS_CATEGORY_CONFIGS = {
    [INSTRUCTIONS_CATEGORY_KEYS.anything]: {
        textInputPromptText: 'Any details to share with the AI on what to promote?',
        textInputPlaceholderText: 'e.g. add our slogan: go wombats, HVAC services 10% off',
        buttonContents: ( <
            >
            <
            PromoteOtherIcon / >
            <
            span > Anything < /span> <
            />
        ),
    },
    [INSTRUCTIONS_CATEGORY_KEYS.myBrand]: {
        textInputPromptText: 'What features of your product or service do you want to highlight?',
        textInputPlaceholderText: 'e.g. our work comes with a lifetime guarantee',
        buttonContents: ( <
            >
            <
            PromoteMyBusinessIcon / >
            <
            span > My Brand < /span> <
            />
        ),
    },
    [INSTRUCTIONS_CATEGORY_KEYS.event]: {
        textInputPromptText: 'What are the details and highlights of your event?',
        textInputPlaceholderText: 'e.g. Summer Fun Parade, July 17th in the Grand Plaza',
        buttonContents: ( <
            >
            <
            PromoteEventCalendarIcon / >
            <
            span > Event < /span> <
            />
        ),
    },
    [INSTRUCTIONS_CATEGORY_KEYS.jobOpenings]: {
        textInputPromptText: 'What position(s) are you hiring? Any details or perks to highlight?',
        textInputPlaceholderText: 'e.g. HVAC technicians, flexible hours, competitive pay',
        buttonContents: ( <
            >
            <
            PromoteJobListingIcon / >
            <
            span > Job Openings < /span> <
            />
        ),
    },
};

const INSTRUCTIONS_CATEGORY_KEYS_ARRAY = Object.values(INSTRUCTIONS_CATEGORY_KEYS);

/**
 * Renders a text input and category buttons for the user to enter custom instructions in the brand it modal
 */
export default function BrandItCustomInstructionsUI({
    selectedUserInstructionsCategoryKey,
    setSelectedUserInstructionsCategoryKey,
    userInstructionsText,
    setUserInstructionsText,
}) {
    const isMobile = useIsWindowMobile();
    const [headlineTextStyle] = useTypography(['headline']);

    return ( <
        >
        <
        CrossFadeTransition transitionKey = {
            selectedUserInstructionsCategoryKey
        } >
        <
        WaymarkTextInput value = {
            userInstructionsText
        }
        label = {
            INSTRUCTIONS_CATEGORY_CONFIGS[selectedUserInstructionsCategoryKey].textInputPromptText
        }
        placeholder = {
            INSTRUCTIONS_CATEGORY_CONFIGS[selectedUserInstructionsCategoryKey]
            .textInputPlaceholderText
        }
        onChange = {
            (event) => setUserInstructionsText(event.target.value)
        }
        shouldExpandWithDynamicRows
        // Make the input default to at least 2 rows tall on mobile
        // (this just looks a bit better but also helps prevent
        // placeholder text from being cut off)
        minRows = {
            isMobile ? 2 : 1
        }
        // Limit the input to a maximum of 1000 characters; extremely long inputs can cause
        // the AI to timeout so this is an arbitrary number which should help limit that
        maxLength = {
            1000
        }
        inputClassName = {
            css `
            max-width: 440px;
            margin: 0 auto;
          `
        }
        labelClassName = {
            emotionClassNames(
                headlineTextStyle,
                css `
              margin: 0 0 12px;
              text-align: center;
            `,
            )
        }
        /> <
        /CrossFadeTransition> <
        div className = {
            css `
          margin: 12px auto 32px;

          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          gap: 12px;
        `
        } >
        {
            INSTRUCTIONS_CATEGORY_KEYS_ARRAY.map((categoryKey) => {
                const isSelected = categoryKey === selectedUserInstructionsCategoryKey;

                return ( <
                    WaymarkButton key = {
                        categoryKey
                    }
                    onClick = {
                        () => setSelectedUserInstructionsCategoryKey(categoryKey)
                    }
                    colorTheme = {
                        isSelected ? 'Primary' : 'Secondary'
                    }
                    isSmall typography = "caption2"
                    className = {
                        emotionClassNames(
                            css `
                  display: flex;
                  align-items: center;
                  justify-content: center;

                  --button-gap: 6px;
                  gap: var(--button-gap);

                  padding: 8px !important;

                  svg {
                    width: 16px;
                    height: auto;
                    stroke-width: 2;
                  }

                  @media ${breakpoints.small.queryDown} {
                    /* On small screens, limit to 2 buttons per flex row
                      (subtracting the button gap because we only care about the buttons themselves) */
                    flex-basis: calc(50% - var(--button-gap));
                  }
                `,
                        )
                    }
                    isUppercase = {
                        false
                    } >
                    {
                        INSTRUCTIONS_CATEGORY_CONFIGS[categoryKey].buttonContents
                    } <
                    /WaymarkButton>
                );
            })
        } <
        /div> <
        />
    );
}
BrandItCustomInstructionsUI.propTypes = {
    selectedUserInstructionsCategoryKey: PropTypes.string.isRequired,
    setSelectedUserInstructionsCategoryKey: PropTypes.func.isRequired,
    userInstructionsText: PropTypes.string.isRequired,
    setUserInstructionsText: PropTypes.func.isRequired,
};