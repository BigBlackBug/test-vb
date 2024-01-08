import { modalFooter } from './ModalFooterSection.css';

interface ModalFooterSection {
  /**
   * Custom children to render inside the header section.
   */
  children?: React.ReactNode;
}

/**
 * A single button to dismiss a modal.
 */
export const ModalFooterSection = ({ children }: ModalFooterSection) => (
  <div className={modalFooter}>{children}</div>
);
