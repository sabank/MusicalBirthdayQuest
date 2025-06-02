
import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', message }) => {
  let spinnerSizeClass = 'w-12 h-12';
  if (size === 'sm') spinnerSizeClass = 'w-8 h-8';
  if (size === 'lg') spinnerSizeClass = 'w-16 h-16';

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div
        className={`animate-spin rounded-full ${spinnerSizeClass} border-t-4 border-b-4 border-pink-500`}
      ></div>
      {message && <p className="mt-3 text-pink-400 text-sm">{message}</p>}
    </div>
  );
};

export default LoadingSpinner;
