import React from 'react';
import clsx from 'clsx';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'error' | 'info';
}

const variantClasses = {
  success: 'bg-green-100 text-green-800',
  warning: 'bg-yellow-100 text-yellow-800',
  error: 'bg-red-100 text-red-800',
  info: 'bg-blue-100 text-blue-800',
};

const Badge: React.FC<BadgeProps> = ({ className, variant = 'info', children, ...props }) => {
  return (
    <div
      className={clsx(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        variantClasses[variant],
        className
      )}
      role="status"
      {...props}
    >
      {children}
    </div>
  );
};

Badge.displayName = 'Badge';

export default Badge;
