import React, { forwardRef } from 'react';
import clsx from 'clsx';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  error?: boolean;
  helperText?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'px-2.5 py-1.5 text-sm rounded',
  md: 'px-3 py-2 text-base rounded-md',
  lg: 'px-4 py-3 text-lg rounded-lg',
};

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      size = 'md',
      error,
      disabled,
      helperText,
      ...props
    },
    ref
  ) => {
    return (
      <div className="w-full">
        <input
          ref={ref}
          disabled={disabled}
          className={clsx(
            'w-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed border',
            sizeClasses[size],
            disabled
              ? 'border-gray-200 bg-gray-50 text-gray-500'
              : error
                ? 'border-red-500 bg-white text-gray-900 focus-visible:ring-red-500 focus-visible:border-red-500'
                : 'border-gray-300 bg-white text-gray-900 focus-visible:ring-blue-500 focus-visible:border-blue-500',
            className
          )}
          aria-invalid={error}
          aria-describedby={helperText ? `${props.id}-helper` : undefined}
          {...props}
        />
        {helperText && (
          <p
            id={`${props.id}-helper`}
            className={clsx('text-sm mt-1', error ? 'text-red-500' : 'text-gray-500')}
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
