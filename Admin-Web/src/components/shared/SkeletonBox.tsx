import React from 'react';
import clsx from 'clsx';

export interface SkeletonBoxProps {
  width?: string | number;
  height?: string | number;
  className?: string;
  'data-testid'?: string;
}

/**
 * SkeletonBox - Animated gray rectangle for generic loading placeholders
 * Displays a smooth shimmer animation to indicate loading state
 */
const SkeletonBox = React.forwardRef<HTMLDivElement, SkeletonBoxProps>(
  (
    {
      width = '100%',
      height = '16px',
      className,
      'data-testid': testId = 'skeleton-box',
    },
    ref
  ) => {
    const widthClass = typeof width === 'number' ? `w-[${width}px]` : width;
    const heightClass = typeof height === 'number' ? `h-[${height}px]` : height;

    return (
      <div
        ref={ref}
        className={clsx(
          'rounded bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200',
          'animate-pulse',
          widthClass,
          heightClass,
          className
        )}
        data-testid={testId}
        role="status"
        aria-label="Loading content"
      />
    );
  }
);

SkeletonBox.displayName = 'SkeletonBox';

export default SkeletonBox;
