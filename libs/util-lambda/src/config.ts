import { AppError, HttpStatusCode } from 'libs/lambda-routing';

export function requireEnvironmentVariable(name: string): string {
  const value = process.env[name];
  if (value === undefined) {
    throw new AppError(
      `${name} is a required environment variable`,
      undefined,
      HttpStatusCode.INTERNAL_SERVER_ERROR,
      false, // don't show the configuration screwup to clients
    );
  }
  return value;
}
