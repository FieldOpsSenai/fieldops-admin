import React from 'react';
import clsx from 'clsx';

export interface SkeletonTextProps {
  lines?: number;
  className?: string;
  lineHeight?: 'sm' | 'md' | 'lg';
}

/**
 * SkeletonText - Animated rectangle for text blocks
 * Supports multiple line variants for paragraph loading states
 */
const SkeletonText = React.forwardRef<HTMLDivElement, SkeletonTextProps>(
  ({ lines = 3, className, lineHeight = 'md' }, ref) => {
    const heightMap = {
      sm: 'h-3',
      md: 'h-4',
      lg: 'h-5',
    };

    const gapMap = {
      sm: 'gap-2',
      md: 'gap-2.5',
      lg: 'gap-3',
    };

    return (
      <div ref={ref} className={clsx('flex flex-col', gapMap[lineHeight], className)}>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={clsx(
              'rounded bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200',
              'animate-pulse w-full',
              heightMap[lineHeight]
            )}
            data-testid={`skeleton-text-line-${index}`}
            role="status"
            aria-label={`Loading text line ${index + 1}`}
          />
        ))}
      </div>
    );
  }
);

SkeletonText.displayName = 'SkeletonText';

export default SkeletonText;
