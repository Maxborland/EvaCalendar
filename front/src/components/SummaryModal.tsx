import { useCallback, useState } from 'react';
import * as ReactDOM from 'react-dom';
import SummaryBlock from './SummaryBlock';
import './SummaryModal.css';

interface SummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  weekStartDate: string;
}

const SummaryModal = ({ isOpen, onClose: originalOnClose, weekStartDate }: SummaryModalProps) => {
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      originalOnClose();
      setIsClosing(false);
    }, 300);
  }, [originalOnClose]);

  if (!isOpen && !isClosing) {
    return null;
  }

  const modalOverlayClass = `summary-modal-overlay ${isClosing ? 'closing' : ''}`;
  const modalContentClass = `summary-modal-content ${isClosing ? 'closing' : ''}`;

  const modalContent = (
    <div className={modalOverlayClass} onClick={handleClose}>
      <div className={modalContentClass} onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="summary-modal__close"
          onClick={handleClose}
          aria-label="Закрыть"
        >
          <span className="material-icons">close</span>
        </button>
        <SummaryBlock weekStartDate={weekStartDate} />
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

export default SummaryModal;