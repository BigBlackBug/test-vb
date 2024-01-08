import { modalHeader } from './ModalHeaderSection.css';

interface ModalHeaderSection {
  /**
   * Custom children to render inside the header section.
   */
  children?: React.ReactNode;
}

/**
 * A single button to dismiss a modal.
 */
export const ModalHeaderSection = ({ children }: ModalHeaderSection) => (
  <div className={modalHeader}>{children}</div>
);
