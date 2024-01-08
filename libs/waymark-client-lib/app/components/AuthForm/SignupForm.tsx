import { css } from '@emotion/css';
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import _ from 'lodash';

import authOperations from 'app/state/ducks/accounts/authOperations.js';
import { WaymarkButton } from 'shared/components/WaymarkButton';
import WaymarkTextInput from 'shared/components/WaymarkTextInput';
import { isValidEmail } from 'shared/utils/urls.js';
import { ExternalLink } from 'shared/components/WaymarkLinks';
import GoogleAnalyticsService from 'app/services/GoogleAnalyticsService.js';
import { cmsURLs, queryParams } from 'app/constants/urls.js';
import { darkCoolGrayColor } from 'styles/themes/waymark/colors.js';
import { themeVars } from '@libs/shared-ui-styles';
import { useTypography } from 'styles/hooks/typography.js';
import {
  useCompanyNameField,
  useEmailField,
  useNameField,
  usePasswordField,
} from './state/authFormFields';
import { AuthFormView } from './types';

const MIN_PASSWORD_LENGTH = 8;

interface SignupFormProps {
  onChangeFormView: (newFormView: AuthFormView) => void;
  shouldNavigateOnLogin: boolean;
  onLoginSuccess?: () => void;
}

interface SignupFormErrors {
  email?: string | React.ReactNode;
  password?: string | React.ReactNode;
  companyName?: string | React.ReactNode;
  general?: string | React.ReactNode;
}

/**
 * Renders a signup form with name, company name, email and password inputs
 * @param {function} onChangeFormView - Callback which updates the current view for the auth form
 * @param {boolean} shouldNavigateOnLogin - Whether the page should preform a post-login redirect, this should be false for modals
 */
export default function SignupForm({
  onChangeFormView,
  shouldNavigateOnLogin,
  onLoginSuccess = undefined,
}: SignupFormProps) {
  const [email, setEmail] = useEmailField();
  const [password, setPassword] = usePasswordField();
  const [companyName, setCompanyName] = useCompanyNameField();
  const [name, setName] = useNameField();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<SignupFormErrors | null>(null);

  const dispatch = useDispatch();

  const [title1SmallStyle, headlineSmallStyle] = useTypography(['title1Small', 'headlineSmall']);

  const onSubmitSignup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    GoogleAnalyticsService.trackEvent('submit_signup_form');

    const sanitizedEmail = email.trim().toLowerCase();
    const sanitizedCompanyName = companyName.trim();
    const sanitizedName = name.trim();

    const validationErrors: SignupFormErrors = {};

    if (sanitizedEmail.length === 0) {
      validationErrors.email = 'Please supply an email address';
    } else if (!isValidEmail(sanitizedEmail)) {
      validationErrors.email = 'Please supply a valid email address';
    }

    if (password.length === 0) {
      validationErrors.password = 'Please supply a password';
    } else if (password.length < MIN_PASSWORD_LENGTH) {
      validationErrors.password = 'Please use a password with at least 8 characters';
    }

    if (sanitizedCompanyName.length === 0) {
      validationErrors.companyName = 'Please supply a company name';
    }

    if (!_.isEmpty(validationErrors)) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors(null);

    const parsedQueryParams = new URLSearchParams(window.location.search);

    try {
      await dispatch(
        authOperations.signup(
          {
            emailAddress: sanitizedEmail,
            password,
            companyName: sanitizedCompanyName,
            name: sanitizedName,
            accountGroupInviteCode: parsedQueryParams.get(queryParams.accountGroup),
          },
          shouldNavigateOnLogin,
        ),
      );
      onLoginSuccess?.();
    } catch (error) {
      const signupErrors: SignupFormErrors = {};

      if (error && typeof error === 'object') {
        const fieldErrors =
          'fieldErrors' in error ? (error.fieldErrors as Record<string, string>) : {};

        // If we get a 400 response and an email fieldError, the submitted email is already in use
        const hasEmailValidationError =
          'statusCode' in error && error.statusCode === 400 && Boolean(fieldErrors.email);

        if (hasEmailValidationError) {
          signupErrors.email = (
            <div>
              There&apos;s already an account using that email address.{' '}
              <WaymarkButton
                onClick={() => onChangeFormView(AuthFormView.Login)}
                analyticsAction="selected_login_form"
                colorTheme="NegativeText"
                typography="inherit"
                className={css`
                  text-decoration: underline;
                `}
                hasFill={false}
                isUppercase={false}
              >
                You can log in
              </WaymarkButton>{' '}
              or use another email.
            </div>
          );
        } else if (fieldErrors.email) {
          signupErrors.email = fieldErrors.email;
        }
        if (fieldErrors.password) {
          signupErrors.password = fieldErrors.password;
        }
        if (fieldErrors.companyName) {
          signupErrors.companyName = fieldErrors.companyName;
        }
        // This is to catch if trying to create an account with an expired account group invite code
        if (fieldErrors.account_group) {
          signupErrors.general = fieldErrors.account_group;
        }
      }

      if (_.isEmpty(signupErrors)) {
        // We have an unhandled error, so we'll display a generic message.
        console.error(error);
        signupErrors.general =
          'Sorry, something went wrong while creating your account. Please try again later.';
      }

      setErrors(signupErrors);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div data-testid="signupForm">
      <h3
        className={css`
          ${title1SmallStyle}
          margin-bottom: 20px;
        `}
      >
        Make a free account
      </h3>
      <p
        className={css`
          margin-bottom: 24px;
        `}
      >
        Save, share, and buy videos
      </p>

      <form
        onSubmit={onSubmitSignup}
        className={css`
          label {
            margin-bottom: 16px;
          }
        `}
      >
        <WaymarkTextInput
          autoComplete="name"
          placeholder="Jane Bao"
          name="name"
          label="Name"
          onChange={(event) => {
            setName(event.currentTarget.value);
          }}
          value={name}
        />
        <WaymarkTextInput
          autoComplete="organization"
          placeholder="Company ABC"
          name="companyName"
          type="text"
          label="Company Name"
          subtext={errors?.companyName}
          hasError={Boolean(errors?.companyName)}
          onChange={(event) => {
            setCompanyName(event.currentTarget.value);
          }}
          value={companyName}
        />

        <WaymarkTextInput
          name="email"
          label="Email"
          type="email"
          placeholder="youremail@gmail.com"
          autoComplete="username"
          value={email}
          subtext={errors?.email}
          hasError={Boolean(errors?.email)}
          onChange={(event) => {
            setEmail(event.currentTarget.value);
          }}
        />

        <WaymarkTextInput
          name="password"
          label="Create Password"
          type="password"
          autoComplete="new-password"
          subtext={errors?.password}
          hasError={Boolean(errors?.password)}
          value={password}
          onChange={(event) => {
            setPassword(event.currentTarget.value);
          }}
        />

        {errors?.general ? (
          <p
            className={css`
              margin: 12px 0 0;
              color: ${themeVars.color.negative.default};
            `}
          >
            {errors.general}
          </p>
        ) : null}

        <WaymarkButton
          data-testid="signupSubmitButton"
          type="submit"
          colorTheme="Primary"
          isLoading={isSubmitting}
          className={css`
            width: 100%;
            margin: 28px 0 24px 0;
            display: block;
          `}
        >
          Create account
        </WaymarkButton>

        <p
          className={css`
            ${headlineSmallStyle}
            margin: 24px;
            text-align: center;
            color: ${darkCoolGrayColor};
            line-height: 1.67;
          `}
        >
          By signing up, you agree to Waymark&apos;s&nbsp;
          <ExternalLink
            colorTheme="PrimaryText"
            underlineMode="hover"
            linkTo={cmsURLs.terms}
            isCMSPageLink
            analyticsAction="selected_terms_link"
          >
            Terms
          </ExternalLink>{' '}
          and{' '}
          <ExternalLink
            colorTheme="PrimaryText"
            underlineMode="hover"
            linkTo={cmsURLs.privacy}
            isCMSPageLink
            analyticsAction="selected_privacy_link"
          >
            Privacy Policy
          </ExternalLink>
          .
        </p>

        <p
          className={css`
            border-top: 1px solid ${themeVars.color.shadow._36};
            margin: 0;
            padding-top: 24px;
            text-align: center;
            ${headlineSmallStyle}
          `}
        >
          Already have an account?{' '}
          <WaymarkButton
            analyticsAction="selected_login_form"
            onClick={() => {
              onChangeFormView(AuthFormView.Login);
            }}
            className={css`
              text-decoration: underline;
            `}
            isUppercase={false}
            hasFill={false}
            colorTheme="PrimaryText"
            typography="inherit"
          >
            Log in
          </WaymarkButton>
        </p>
      </form>
    </div>
  );
}
