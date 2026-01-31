import clsx from 'clsx';
import { useCallback, useState } from 'react';
import * as ReactDOM from 'react-dom';
import SummaryBlock from './SummaryBlock';

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

  const modalContent = (
    <div
      className={clsx(
        'fixed inset-0 p-[clamp(12px,4vh,28px)_clamp(12px,4vw,24px)] bg-modal-overlay flex items-center justify-center z-[1050]',
        isClosing ? 'animate-fade-out' : 'animate-fade-in',
      )}
      onClick={handleClose}
    >
      <div
        className={clsx(
          'w-[min(520px,100%)] max-h-[calc(100dvh-40px)] bg-modal-content rounded-[20px] shadow-elevation-3 relative p-[var(--spacing-lg)] overflow-y-auto scrollbar-thin',
          isClosing ? 'animate-scale-down' : 'animate-scale-up',
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="absolute top-4 right-4 size-11 rounded-xl border border-border-subtle bg-white/[0.04] text-text-secondary inline-flex items-center justify-center transition-all duration-[160ms] z-10 hover:rotate-[-90deg] hover:border-border-strong hover:bg-white/[0.08] [&_.material-icons]:text-[22px]"
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
