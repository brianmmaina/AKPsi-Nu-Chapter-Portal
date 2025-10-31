import { useEffect } from 'react';

const Toast = ({ message, type = 'info', onClose, duration = 3000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const bgColor = {
    success: '#10b981',
    error: '#ef4444',
    info: '#3b82f6',
    warning: '#f59e0b',
  }[type] || bgColor.info;

  return (
    <div
      className="fixed top-4 right-4 z-50 px-4 py-3 rounded-md shadow-lg fade-zoom"
      style={{ backgroundColor: bgColor, color: 'white', minWidth: '300px' }}
    >
      <div className="flex items-center justify-between">
        <span className="font-medium">{message}</span>
        <button
          onClick={onClose}
          className="ml-4 text-white hover:text-gray-200 text-xl leading-none"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default Toast;

