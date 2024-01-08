import LoginForm from './LoginForm';
import ResetPasswordForm from './ResetPasswordForm';
import SignupForm from './SignupForm';
import { AuthFormView } from './types';

interface AuthFormProps {
  formView: AuthFormView;
  onChangeFormView: (newFormView: AuthFormView) => void;
  shouldNavigateOnLogin?: boolean;
  onLoginSuccess?: () => void;
}

/**
 * Renders a login, signup, or password reset form
 * @param {AuthFormView} formView - Determines which form view to show
 * @param {function} onChangeFormView - Callback to update the current view for the auth form
 * @param {boolean} [shouldNavigateOnLogin] - Whether the page should preform a post-login redirect after a login, this should be false for modals
 * @param {function} [onLoginSuccess] - Callback for when a login is completed succesfully
 */
export default function AuthForm({
  formView,
  onChangeFormView,
  shouldNavigateOnLogin = false,
  onLoginSuccess = undefined,
}: AuthFormProps) {
  switch (formView) {
    case AuthFormView.Login:
      return (
        <LoginForm
          onChangeFormView={onChangeFormView}
          shouldNavigateOnLogin={shouldNavigateOnLogin}
          onLoginSuccess={onLoginSuccess}
        />
      );
    case AuthFormView.Signup:
      return (
        <SignupForm
          onChangeFormView={onChangeFormView}
          shouldNavigateOnLogin={shouldNavigateOnLogin}
          onLoginSuccess={onLoginSuccess}
        />
      );
    default:
      return <ResetPasswordForm onChangeFormView={onChangeFormView} />;
  }
}
