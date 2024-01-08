import classNames from 'classnames';

import * as styles from './ModalButtonForm.css';

/**
 * A form element which will close the form when submitted.
 * We can wrap submit buttons with this form to close the modal when the user clicks the button
 * instead of having to manually manage closing the modal with an onClick handler
 */
export const ModalButtonForm = ({ className, ...rest }: React.HTMLAttributes<HTMLFormElement>) => (
  <form method="dialog" className={classNames(styles.CloseModalForm, className)} {...rest} />
);
