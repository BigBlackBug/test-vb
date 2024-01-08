import classNames from 'classnames';

import * as styles from './ModalBodyText.css';

interface ModalBodyTextProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
}

export const ModalBodyText = ({ className, children, ...props }: ModalBodyTextProps) => (
  <p className={classNames(styles.ModalBodyText, className)} {...props}>
    {children}
  </p>
);
