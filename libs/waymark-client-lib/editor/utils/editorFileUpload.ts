/**
 * Custom error class used for displaying custom error messages in the EditorFileUploadErrorModal component
 *
 * Takes the heading and body to display in the modal when we want to show the user an error message due to
 * an invalid or failed upload attempt
 */
export class EditorFileUploadError {
  heading: string;
  body: string | null;

  constructor(heading: string, body: string | null = null) {
    this.heading = heading;
    this.body = body;
  }
}
