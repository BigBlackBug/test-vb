import classNames from 'classnames';

import * as styles from './ModalHeadingText.css';

interface ModalHeadingTextProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
}

export const ModalHeadingText = ({ className, children, ...props }: ModalHeadingTextProps) => (
  <h1 className={classNames(styles.ModalHeadingText, className)} {...props}>
    {children}
  </h1>
);
