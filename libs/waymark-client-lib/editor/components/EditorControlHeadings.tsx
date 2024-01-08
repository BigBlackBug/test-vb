// Vendor
import { css, cx as emotionClassNames } from '@emotion/css';

// Styles
import { useTypography } from 'styles/hooks/typography.js';
import { typographyStyleVariants } from '@libs/shared-ui-styles/src';

interface HeadingComponentProps extends React.ComponentPropsWithoutRef<'div'> {
  /**
   * The contents of the primary header text
   */
  heading: string | React.ReactNode;
  /**
   * Optional className to apply custom styles to the primary header text
   */
  headingClassName?: string | null;
  /**
   * Optional supporting contents under the header text
   */
  subheading?: string | React.ReactNode | null;
  /**
   * Optional className to apply custom styles to the subheading
   */
  subheadingClassName?: string | null;
  /**
   * The name of a typography style class to apply to the button. If not provided, the button will default to
   * either "button" or "buttonSmall" depending on the `isSmall`/`isLarge` props
   */
  headerTypography?: keyof typeof typographyStyleVariants | null;
}

/**
 * Re-usable component for the headings at the top of each editor control panel's heading
 */
export const EditorControlPanelHeading = ({
  heading,
  headingClassName = null,
  subheading = null,
  subheadingClassName = null,
  headerTypography = null,
  ...props
}: HeadingComponentProps) => {
  const [bodyTextStyle] = useTypography(['body']);

  const headerTypographyClass = headerTypography
    ? typographyStyleVariants[headerTypography]
    : typographyStyleVariants.title3;

  return (
    <div {...props}>
      <h1
        className={emotionClassNames(
          headerTypographyClass,
          css`
            margin: 8px 0 12px;
            text-align: left;
          `,
          headingClassName,
        )}
      >
        {heading}
      </h1>
      {subheading && (
        <div
          className={emotionClassNames(
            bodyTextStyle,
            css`
              margin: 0 0 32px;
            `,
            subheadingClassName,
          )}
        >
          {subheading}
        </div>
      )}
    </div>
  );
};

/**
 * Re-usable component for the headings of sub-sections in an editor control panel
 */
export const EditorControlSectionHeading = ({
  heading,
  headingClassName = null,
  subheading = null,
  subheadingClassName = null,
  headerTypography = null,
  ...props
}: HeadingComponentProps) => {
  const [bodySmallTextStyle] = useTypography(['bodySmall']);

  const headerTypographyClass = headerTypography
    ? typographyStyleVariants[headerTypography]
    : typographyStyleVariants.title6;

  return (
    <div {...props}>
      <h3
        className={emotionClassNames(
          headerTypographyClass,
          css`
            margin: 0 0 6px;
          `,
          headingClassName,
        )}
      >
        {heading}
      </h3>
      {subheading && (
        <p
          className={emotionClassNames(
            bodySmallTextStyle,
            css`
              margin: 0;
            `,
            subheadingClassName,
          )}
        >
          {subheading}
        </p>
      )}
    </div>
  );
};
