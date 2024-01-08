import { useSelector, useDispatch } from 'react-redux';
import { useState } from 'react';
import { css } from '@emotion/css';
import _ from 'lodash';

import { WaymarkButton } from 'shared/components/WaymarkButton';
import WaymarkTextInput from 'shared/components/WaymarkTextInput';
import { themeVars } from '@libs/shared-ui-styles';
import { useTypography } from 'styles/hooks/typography.js';
import authOperations from 'app/state/ducks/accounts/authOperations.js';
import * as selectors from 'app/state/selectors/index.js';
import GoogleAnalyticsService from 'app/services/GoogleAnalyticsService.js';
import { useEmailField, usePasswordField } from './state/authFormFields';
import { AuthFormView } from './types';

export interface LoginFormProps {
  onChangeFormView: (newFormView: AuthFormView) => void;
  shouldNavigateOnLogin: boolean;
  onLoginSuccess?: () => void;
}

interface LoginFormErrors {
  email?: string | React.ReactNode;
  password?: string | React.ReactNode;
  general?: string | React.ReactNode;
}

/**
 * Renders a login form with an email and password input
 * @param {function} onChangeFormView - Callback which updates the current view for the auth form
 * @param {boolean} shouldNavigateOnLogin - Whether the page should preform a post-login redirect after a login, this should be false for modals
 */
export default function LoginForm({
  onChangeFormView,
  shouldNavigateOnLogin,
  onLoginSuccess = undefined,
}: LoginFormProps) {
  const [email, setEmail] = useEmailField();
  const [password, setPassword] = usePasswordField();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<LoginFormErrors | null>(null);
  const dispatch = useDispatch();

  const isSignupDisabled = useSelector(selectors.getBrandingProfileIsPrivateParterSite);

  const [title1SmallStyle, headlineSmallStyle] = useTypography(['title1Small', 'headlineSmall']);

  /**
   * Submits a login request with the email and password entered in the login form
   */
  const onSubmitLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    GoogleAnalyticsService.trackEvent('submit_login_form');

    const validationErrors: LoginFormErrors = {};

    const sanitizedEmail = email.trim().toLowerCase();
    if (sanitizedEmail.length === 0) {
      validationErrors.email = 'Please supply an email address';
    }
    if (password.length === 0) {
      validationErrors.password = 'Please supply a password';
    }

    if (!_.isEmpty(validationErrors)) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors(null);

    try {
      await dispatch(
        authOperations.accountLogin({ emailAddress: email, password }, shouldNavigateOnLogin),
      );
      onLoginSuccess?.();
    } catch (error) {
      const loginErrors: LoginFormErrors = {};

      if (error && typeof error === 'object') {
        const fieldErrors =
          'fieldErrors' in error ? (error.fieldErrors as Record<string, string>) : {};

        const hasUnauthorizedError = 'statusCode' in error && error.statusCode === 401;

        if (fieldErrors.password && hasUnauthorizedError) {
          loginErrors.password = (
            <div>
              That email and password combination does not match.&nbsp;
              <WaymarkButton
                onClick={() => {
                  onChangeFormView(AuthFormView.ResetPassword);
                }}
                analyticsAction="selected_reset_password"
                colorTheme="NegativeText"
                typography="inherit"
                className={css`
                  text-decoration: underline;
                `}
                hasFill={false}
                isUppercase={false}
              >
                Reset password
              </WaymarkButton>
            </div>
          );
        } else if (fieldErrors.password) {
          loginErrors.password = fieldErrors.password;
        }
        if (fieldErrors.email) {
          loginErrors.email = fieldErrors.email;
        }
      }

      if (_.isEmpty(loginErrors)) {
        // If we have an unhandled error, display a generic message.
        console.error(error);
        loginErrors.general =
          'Sorry, something went wrong while logging you in. Please try again later.';
      }

      setErrors(loginErrors);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div data-testid="loginForm">
      <h3
        className={css`
          ${title1SmallStyle}
          margin-bottom: 36px;
        `}
      >
        Log in
      </h3>

      <form onSubmit={onSubmitLogin}>
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
          className={css`
            margin-bottom: 16px;
          `}
        />

        <WaymarkTextInput
          data-testid="passwordField"
          name="password"
          label={
            <>
              Password{' '}
              <WaymarkButton
                analyticsAction="selected_reset_password"
                isUppercase={false}
                hasFill={false}
                onClick={() => {
                  onChangeFormView(AuthFormView.ResetPassword);
                }}
                typography="inherit"
                colorTheme="GrayText"
              >
                Forgot?
              </WaymarkButton>
            </>
          }
          labelClassName={css`
            display: flex;
            justify-content: space-between;
          `}
          type="password"
          autoComplete="current-password"
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
          data-testid="loginSubmitButton"
          type="submit"
          colorTheme="Primary"
          isLoading={isSubmitting}
          className={css`
            width: 100%;
            margin: 28px 0 24px 0;
          `}
        >
          Log in
        </WaymarkButton>

        {isSignupDisabled ? null : (
          <p
            className={css`
              border-top: 1px solid ${themeVars.color.shadow._36};
              margin: 0;
              padding-top: 24px;
              text-align: center;
              ${headlineSmallStyle}
            `}
          >
            New here?{' '}
            <WaymarkButton
              analyticsAction="selected_signup_form"
              onClick={() => {
                onChangeFormView(AuthFormView.Signup);
              }}
              className={css`
                text-decoration: underline;
              `}
              isUppercase={false}
              hasFill={false}
              colorTheme="PrimaryText"
              typography="inherit"
            >
              Create an account
            </WaymarkButton>
          </p>
        )}
      </form>
    </div>
  );
}
