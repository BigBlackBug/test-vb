import classNames from 'classnames';

import { dotLoader, dotLoaderDot } from './DotLoader.css';

interface DotLoaderProps extends React.ComponentPropsWithoutRef<'div'> {
  /**
   * A className to apply custom styles to the loader's container div
   */
  className?: string;
  /**
   * A className to apply custom styles to each dot
   */
  dotClassName?: string;
}

/**
 * Defines a 3 dot loader animation.
 */
export const DotLoader = ({ className, dotClassName, ...props }: DotLoaderProps) => {
  const combinedDotClassName = classNames(dotLoaderDot, dotClassName);
  return (
    <div className={classNames(dotLoader, className)} data-testid="dotLoader" {...props}>
      <div className={combinedDotClassName} />
      <div className={combinedDotClassName} />
      <div className={combinedDotClassName} />
    </div>
  );
};
