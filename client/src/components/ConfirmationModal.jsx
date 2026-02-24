import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FaSpinner } from 'react-icons/fa';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Delete', isLoading = false }) => {
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isOpen) onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return createPortal(
        <div
            className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-[200] p-4 backdrop-blur-sm"
            onClick={onClose}
        >
            {/* stopPropagation prevents backdrop click from firing when clicking inside the card */}
            <div
                className="bg-white rounded-2xl shadow-xl w-[95%] sm:w-full max-w-md mx-auto p-4 sm:p-6"
                onClick={e => e.stopPropagation()}
            >
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    {title}
                </h3>
                <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                    {message}
                </p>
                <div className="flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isLoading}
                        className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 cursor-pointer hover:opacity-90 active:scale-95 transition-standard font-medium focus-ring disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 cursor-pointer hover:opacity-90 transition-standard font-medium shadow-sm hover:scale-[1.02] active:scale-95 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center min-w-[100px]"
                    >
                        {isLoading ? (
                            <>
                                <FaSpinner className="animate-spin mr-2" />
                                {confirmText.endsWith('e') ? `${confirmText}ing...` : `${confirmText}ing...`}
                            </>
                        ) : (
                            confirmText
                        )}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ConfirmationModal;
