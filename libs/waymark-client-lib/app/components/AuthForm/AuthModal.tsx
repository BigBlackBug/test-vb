import { useState } from 'react';
import withWaymarkModal from 'shared/components/WithWaymarkModal';
import { AuthFormView } from './types';
import AuthForm from './index';

interface AuthModalContentsProps {
  shouldStartOnLogin?: boolean;
  onCloseModal: () => void;
  onLoginSuccess?: () => void;
}

/**
 *  Renders the contents of the auth modal
 * @param {boolean} [shouldStartOnLogin = false] - Whether the modal should show the login form first when opened
 * @param {function} onCloseModal - Closes the modal
 * @param {function} [onLoginSuccess] - Callback which is run after succesful login / signup
 */
function AuthModalContents({
  shouldStartOnLogin = false,
  onCloseModal,
  onLoginSuccess = undefined,
}: AuthModalContentsProps) {
  const [formView, setFormView] = useState(
    shouldStartOnLogin ? AuthFormView.Login : AuthFormView.Signup,
  );

  return (
    <AuthForm
      formView={formView}
      onChangeFormView={setFormView}
      onLoginSuccess={() => {
        onLoginSuccess?.();
        onCloseModal();
      }}
    />
  );
}

const AuthModal = withWaymarkModal()(AuthModalContents);
export default AuthModal;
