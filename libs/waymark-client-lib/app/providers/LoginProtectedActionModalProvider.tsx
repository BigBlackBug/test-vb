// Vendor
import { createContext, useState, useCallback, useContext, useRef } from 'react';
import { useSelector } from 'react-redux';

// Local
import * as selectors from 'app/state/selectors/index.js';
import AuthModal from 'app/components/AuthForm/AuthModal';

const isPromise = (value: unknown): value is Promise<unknown> => value instanceof Promise;

export class LoginCancelledError extends Error {
  constructor() {
    super('Login cancelled by user.');
  }
}

type AttemptLoginProtectedAction = <TReturnType, TAction extends (...args: any) => TReturnType>(
  action: TAction,
  options?: {
    initialAuthFormMode?: 'login' | 'signup';
    onlyRunActionIfAlreadyLoggedIn?: boolean;
  },
) => Promise<TReturnType>;

const LoginProtectedActionModalContext = createContext<AttemptLoginProtectedAction>((async () => {
  console.error('Attempted to use LoginProtectedActionModalContext outside of a provider');
}) as AttemptLoginProtectedAction);

/**
 * Hook returns a function which will either run an action if the user is logged in or open a login modal
 * and wait to run the action until the user has successfully logged in
 *
 * @example
 * const updateAccount = async () => {
 *   // perform some action that requires the user to be logged in
 *   return updatedAccountInfo;
 * }
 *
 * const attemptLoginProtectedAction = useAttemptLoginProtectedAction();
 *
 * const onClickUpdateAccount = async () => {
 *   try {
 *     const updatedAccountInfo = await attemptLoginProtectedAction(updateAccount);
 *
 *     // We will only reach this line if/when the user logs in and the action finishes running
 *     onAccountUpdateSuccess(updatedAccountInfo);
 *   } catch (err) {
 *      // If the attemptLoginProtectedAction promise rejected with a LoginCancelledError,
 *      // this means the login modal was closed early without the user logging in and
 *      // the protected action was therefore cancelled
 *      if(err instanceof LoginCancelledError) return;
 *
 *      // If an error was thrown for any other reason, this is an unexpected error so log it
 *      console.error(err);
 *   }
 * }
 *
 * return <button onClick={onClickUpdateAccount}>Update your account!</button>;
 */
export const useAttemptLoginProtectedAction = () => useContext(LoginProtectedActionModalContext);

export default function LoginProtectedActionModalProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [currentlyAttemptingProtectedAction, setCurrentlyAttemptingProtectedAction] = useState<
    ((...args: any) => any) | null
  >(null);
  // Sets whether the auth modal should default to either a login or signup view when initially opened
  const [initialFormMode, setInitialFormMode] = useState('signup');

  const isLoggedIn = useSelector(selectors.isLoggedIn);

  const actionAttemptPromiseInfoRef = useRef<{
    isPending: boolean;
    resolve: (value?: any) => void;
    reject: (value?: any) => void;
  } | null>(null);

  /**
   * Accepts an "action" callback which should only be run if/when the user is logged in.
   * If the user is logged in, we will just run the action immediately and return the result.
   * Otherwise, we will open a login modal and wait to run the action only after the user successfully logs in.
   * In that case, this function will return a promise which will either resolve upon a successful login or
   * will reject if the user closes the modal and therefore cancels the action.
   *
   * @param {func}  action  Callback function for a "login-protected action" that should only be run if/when the user is logged in
   * @param {Object}  [options]   Object defining additional options for how the protected action should be handled
   * @param {string}  [options.initialAuthFormMode='signup']  Defines whether the auth modal should initially start with either
   *                                                          a 'login' or 'signup' form if it has to be opened
   * @param {bool}    [options.onlyRunActionIfAlreadyLoggedIn=false]  Defines whether the action should only be run if the user is already logged in;
   *                                                                  otherwise, the user will have to finish logging in and then attempt the action again.
   *
   * @returns  {Promise}   If the user is logged in, it will immediately run the protected action and return its return value in a resolved Promise.
   *                          However, if they are logged out, it will return a pending Promise which will either:
   *                            1. resolve with the protected action's return value as soon as the user successfully logs in, or
   *                            2. reject if the user closes the auth modal and therefore cancels the protected action
   */
  const attemptLoginProtectedAction: AttemptLoginProtectedAction = useCallback(
    (action, options) => {
      const { initialAuthFormMode = 'signup', onlyRunActionIfAlreadyLoggedIn = false } =
        options || {};

      // If the user is logged in, just run the action right away and return the result
      if (isLoggedIn) {
        return Promise.resolve(action());
      }

      return new Promise((resolve, reject) => {
        actionAttemptPromiseInfoRef.current = {
          isPending: true,
          resolve,
          reject,
        };

        setCurrentlyAttemptingProtectedAction(() =>
          // If the user wasn't initially logged in and the onlyRunActionIfAlreadyLoggedIn option
          // is set to true, just make the action a noop
          onlyRunActionIfAlreadyLoggedIn ? null : action,
        );
        setInitialFormMode(initialAuthFormMode);
      });
    },
    [isLoggedIn],
  );

  return (
    <LoginProtectedActionModalContext.Provider value={attemptLoginProtectedAction}>
      {children}
      <AuthModal
        // Open the auth modal when we have a protected action attempt in progress
        isVisible={Boolean(currentlyAttemptingProtectedAction)}
        onLoginSuccess={() => {
          const promiseInfo = actionAttemptPromiseInfoRef.current;

          // If for some reason there is no action attempt promise info available, just return
          if (!promiseInfo) {
            return;
          }

          const { isPending, resolve, reject } = promiseInfo;

          // If we have a pending promise and a valid protected action to run, let's do it now that
          // the user has successfully logged in
          if (isPending && currentlyAttemptingProtectedAction) {
            // Mark that the promise is no longer pending as we are about to resolve it
            promiseInfo.isPending = false;

            // Run the protected action and hang onto its return value so we can resolve with that
            const returnValue = currentlyAttemptingProtectedAction();

            // If the protected action was async and its return value was therefore a promise, let's wait for that promise to resolve
            if (isPromise(returnValue)) {
              returnValue.then(
                (resolvedReturnValue) =>
                  // Once the action has completed, resolve our action attempt promise with
                  // the action's return value
                  resolve(resolvedReturnValue),
                // If an error occurred while attempting to run the action, reject our action attempt promise
                (error) => reject(error),
              );
            } else {
              // if the protected action didn't return a promise, just reslve with its
              // return value
              resolve(returnValue);
            }
          }
        }}
        onCloseModal={() => {
          const promiseInfo = actionAttemptPromiseInfoRef.current;

          if (promiseInfo && promiseInfo.isPending) {
            // If the user closed the modal and the protected action promise is still pending,
            // this means that the onSubmitSuccess callback was never fired and the user therefore closed
            // the modal without logging in. In this case, reject the promise
            promiseInfo.reject(new LoginCancelledError());
          }

          // Clear out our promise info and pending action now that we're done with them
          actionAttemptPromiseInfoRef.current = null;
          setCurrentlyAttemptingProtectedAction(null);
        }}
        cancelInterface="x"
        shouldStartOnLogin={initialFormMode === 'login'}
      />
    </LoginProtectedActionModalContext.Provider>
  );
}
