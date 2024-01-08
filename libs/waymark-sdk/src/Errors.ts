/* eslint-disable max-classes-per-file */
/**
 * Error that is raised when a method parameter is invalid.
 */
export class InvalidParameterError extends Error {
  name = 'InvalidParameterError';

  constructor(message?: string) {
    super(message);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, InvalidParameterError);
    }
  }
}

/**
 * Error that is raised when a JWT is invalid.
 */
export class InvalidJWTError extends Error {
  name = 'InvalidJWTError';

  constructor(message?: string) {
    super(message);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, InvalidJWTError);
    }
  }
}

/**
 * Error that is raised when an account ID does not match an existing account.
 */
export class InvalidAccountError extends Error {
  name = 'InvalidAccountError';

  constructor(public accountID: string, message?: string) {
    super(message);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, InvalidAccountError);
    }
  }
}

/**
 * Error that is raised when an account already exists.
 */
export class AccountAlreadyExistsError extends Error {
  name = 'AccountAlreadyExistsError';

  constructor(public accountID: string, message?: string) {
    super(message);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AccountAlreadyExistsError);
    }
  }
}

/**
 * Error that is raised when an account does not exist.
 */
export class AccountDoesNotExistError extends Error {
  name = 'AccountDoesNotExistError';

  constructor(public accountID: string, message?: string) {
    super(message);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AccountDoesNotExistError);
    }
  }
}

/**
 * Error that is raised when account operations are attempted before an account has been authenticated.
 */
export class AccountMustBeAuthenticatedError extends Error {
  name = 'AccountMustBeAuthenticatedError';

  constructor(message?: string) {
    super(message);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AccountMustBeAuthenticatedError);
    }
  }
}

/**
 * Error that is raised when another user is already logged in.
 */
export class ExistingLoginError extends Error {
  name = 'ExistingLoginError';

  constructor(message?: string) {
    super(message);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ExistingLoginError);
    }
  }
}

/**
 * Error that is raised when the user's browser is incapable of running the editor.
 */
export class BrowserCompatibilityError extends Error {
  name = 'BrowserCompatibilityError';

  constructor(message?: string) {
    super(message);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, BrowserCompatibilityError);
    }
  }
}
