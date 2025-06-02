import React, { useEffect, useState } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Allow the component to mount and then trigger the animation
      const timer = setTimeout(() => setInternalIsOpen(true), 10); // Small delay for CSS transition
      return () => clearTimeout(timer);
    } else {
      // Start exit animation
      setInternalIsOpen(false);
      // Note: If parent unmounts Modal immediately, this exit animation might not be fully visible.
      // A more robust exit animation would require the parent to delay unmounting.
    }
  }, [isOpen]);

  // Don't render if parent indicates closed and internal state has caught up (for exit animation)
  if (!isOpen && !internalIsOpen) return null;

  return (
    <div
      // Backdrop
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black transition-opacity duration-300 ease-in-out ${
        internalIsOpen && isOpen ? 'bg-opacity-75 opacity-100' : 'bg-opacity-0 opacity-0 pointer-events-none'
      }`}
      onClick={onClose} // Close modal on backdrop click
    >
      <div
        // Dialog
        onClick={(e) => e.stopPropagation()} // Prevent click inside dialog from closing modal
        className={`bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-lg mx-4 transform transition-all duration-300 ease-in-out ${
          internalIsOpen && isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-pink-400">{title}</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        <div className="text-slate-300">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
