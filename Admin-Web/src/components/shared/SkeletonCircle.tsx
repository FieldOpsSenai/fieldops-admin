import React from 'react';
import clsx from 'clsx';

export interface SkeletonCircleProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

/**
 * SkeletonCircle - Animated circle for avatar/icon placeholders
 * Displays a smooth shimmer animation in circular form
 */
const SkeletonCircle = React.forwardRef<HTMLDivElement, SkeletonCircleProps>(
  ({ size = 'md', className }, ref) => {
    const sizeMap = {
      sm: 'w-8 h-8',
      md: 'w-12 h-12',
      lg: 'w-16 h-16',
      xl: 'w-20 h-20',
    };

    return (
      <div
        ref={ref}
        className={clsx(
          'rounded-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200',
          'animate-pulse',
          sizeMap[size],
          className
        )}
        data-testid="skeleton-circle"
        role="status"
        aria-label="Loading avatar or icon"
      />
    );
  }
);

SkeletonCircle.displayName = 'SkeletonCircle';

export default SkeletonCircle;
