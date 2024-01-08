import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { css } from '@emotion/css';

import { WaymarkButton } from 'shared/components/WaymarkButton';
import WaymarkTextInput from 'shared/components/WaymarkTextInput';
import GoogleAnalyticsService from 'app/services/GoogleAnalyticsService.js';
import { useTypography } from 'styles/hooks/typography.js';
import { themeVars } from '@libs/shared-ui-styles';
import authOperations from 'app/state/ducks/accounts/authOperations.js';
import { useEmailField } from './state/authFormFields';
import { AuthFormView } from './types';

enum SubmissionState {
  Initial,
  InProgress,
  Success,
}

/**
 * Renders a success view after a password reset email has been successfully sent
 * @param {string} email - Email value to display when the password reset email has been succesfully sent
 * @param {function} onChangeFormView - Callback which switches the form view when the "Return to Login" button is pressed
 */
function ResetPasswordSuccessView({
  email,
  onChangeFormView,
}: {
  email: string;
  onChangeFormView: (newFormView: AuthFormView) => void;
}) {
  return (
    <>
      <h3>Success!</h3>
      <p>We have sent an email to {email} with reset instructions.</p>
      <WaymarkButton colorTheme="Primary" onClick={() => onChangeFormView(AuthFormView.Login)}>
        Return to Login
      </WaymarkButton>
    </>
  );
}

interface ResetPasswordSubmissionFormProps {
  email: string;
  submissionState: SubmissionState;
  setSubmissionState: (newSubmissionState: SubmissionState) => void;
  setEmail: (newEmail: string) => void;
  onChangeFormView: (newFormView: AuthFormView) => void;
}

/**
 * Renders a form for submitting a password reset request for an email address
 * @param {string} email - Email value used to initialize password reset
 * @param {string} submissionState - Value of the status of the submission process, used to show loading
 * @param {function} setSubmissionState - Called when the status of the password reset submission process is updated
 * @param {function} setEmail - Called if the email value is updated
 * @param {function} onChangeFormView - Called when the form view is changed
 */
function ResetPasswordSubmissionView({
  email,
  submissionState,
  setSubmissionState,
  setEmail,
  onChangeFormView,
}: ResetPasswordSubmissionFormProps) {
  const [errors, setErrors] = useState<{ email?: string; general?: string } | null>(null);
  const dispatch = useDispatch();

  const [title1SmallStyle] = useTypography(['title1Small']);

  const onSubmitResetPassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    GoogleAnalyticsService.trackEvent('submit_password_recovery_form');

    const sanitizedEmail = email.trim().toLowerCase();

    if (sanitizedEmail.length === 0) {
      setErrors({ email: 'Please supply an email address' });
      return;
    }

    setSubmissionState(SubmissionState.InProgress);

    try {
      await dispatch(authOperations.sendPasswordResetEmail(sanitizedEmail));
      setSubmissionState(SubmissionState.Success);
    } catch (error) {
      let errorMessage =
        'Sorry, something went wrong while attempting to send your password reset email. Please try again later.';

      if (error && typeof error === 'object') {
        if (
          'errorMessage' in error &&
          error.errorMessage &&
          typeof error.errorMessage === 'string'
        ) {
          errorMessage = error.errorMessage as string;
        } else if ('message' in error && error.message && typeof error.message === 'string') {
          errorMessage = error.message as string;
        }
      }

      setErrors({
        general: errorMessage,
      });
      setSubmissionState(SubmissionState.Initial);
    }
  };

  return (
    <div data-testid="resetPasswordForm">
      <h3
        className={css`
          ${title1SmallStyle}
          margin-bottom: 20px;
        `}
      >
        Forgot Password
      </h3>
      <p
        className={css`
          margin-bottom: 24px;
        `}
      >
        Enter your email and we&apos;ll send you a link to reset your password.
      </p>
      <form onSubmit={onSubmitResetPassword}>
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

        <div
          className={css`
            display: flex;
            column-gap: 12px;
            margin-top: 16px;
          `}
        >
          <WaymarkButton
            colorTheme="Secondary"
            className={css`
              width: 30%;
            `}
            onClick={() => onChangeFormView(AuthFormView.Login)}
          >
            Back
          </WaymarkButton>

          <WaymarkButton
            type="submit"
            colorTheme="Primary"
            isLoading={submissionState === SubmissionState.InProgress}
            className={css`
              flex: 1;
            `}
          >
            Send
          </WaymarkButton>
        </div>
      </form>
    </div>
  );
}

interface ResetPasswordFormProps {
  onChangeFormView: (newFormView: AuthFormView) => void;
}

export default function ResetPasswordForm({ onChangeFormView }: ResetPasswordFormProps) {
  const [email, setEmail] = useEmailField();
  const [submissionState, setSubmissionState] = useState(SubmissionState.Initial);

  return submissionState === SubmissionState.Success ? (
    <ResetPasswordSuccessView email={email} onChangeFormView={onChangeFormView} />
  ) : (
    <ResetPasswordSubmissionView
      email={email}
      submissionState={submissionState}
      setSubmissionState={setSubmissionState}
      setEmail={setEmail}
      onChangeFormView={onChangeFormView}
    />
  );
}
