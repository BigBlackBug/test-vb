import ReactDOM from 'react-dom';

export const Portal = ({
  container = document.body,
  children,
}: {
  container?: HTMLElement;
  children: React.ReactNode;
}) => ReactDOM.createPortal(children, container);
