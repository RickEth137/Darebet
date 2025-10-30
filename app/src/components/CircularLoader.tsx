'use client';

interface CircularLoaderProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'red' | 'white' | 'gray';
  className?: string;
}

export function CircularLoader({ 
  size = 'md', 
  color = 'red',
  className = '' 
}: CircularLoaderProps) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2', 
    lg: 'w-8 h-8 border-3',
    xl: 'w-12 h-12 border-4'
  };

  const colorClasses = {
    red: 'border-anarchist-red border-t-transparent',
    white: 'border-anarchist-white border-t-transparent',
    gray: 'border-anarchist-gray border-t-transparent'
  };

  return (
    <div 
      className={`
        animate-spin rounded-full
        ${sizeClasses[size]} 
        ${colorClasses[color]}
        ${className}
      `}
    />
  );
}

interface LoadingSpinnerProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'red' | 'white' | 'gray';
  className?: string;
}

export function LoadingSpinner({ 
  text, 
  size = 'md',
  color = 'red',
  className = '' 
}: LoadingSpinnerProps) {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <CircularLoader size={size} color={color} />
      {text && (
        <span className="text-sm text-anarchist-offwhite font-brutal uppercase tracking-wider">
          {text}
        </span>
      )}
    </div>
  );
}