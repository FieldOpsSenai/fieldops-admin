import React from 'react';
import clsx from 'clsx';
import SkeletonBox from './SkeletonBox';

export interface SkeletonTableProps {
  columnCount: number;
  rowCount?: number;
  className?: string;
}

/**
 * SkeletonTable - Composes skeleton rows matching table column layout
 * Renders animated skeleton cells in a table structure for table loading states
 */
const SkeletonTable = React.forwardRef<HTMLDivElement, SkeletonTableProps>(
  ({ columnCount, rowCount = 5, className }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx('w-full', className)}
        data-testid="skeleton-table"
        role="status"
        aria-label="Loading table data"
      >
        {/* Header Row */}
        <div className="flex gap-4 mb-4 px-4 py-3 border-b border-gray-200">
          {Array.from({ length: columnCount }).map((_, colIndex) => (
            <SkeletonBox
              key={`header-${colIndex}`}
              width="100%"
              height="20px"
              className="flex-1"
              data-testid={`skeleton-table-header-${colIndex}`}
            />
          ))}
        </div>

        {/* Body Rows */}
        <div>
          {Array.from({ length: rowCount }).map((_, rowIndex) => (
            <div
              key={`row-${rowIndex}`}
              className="flex gap-4 px-4 py-3 border-b border-gray-100 hover:bg-gray-50"
              data-testid={`skeleton-table-row-${rowIndex}`}
            >
              {Array.from({ length: columnCount }).map((_, colIndex) => (
                <SkeletonBox
                  key={`cell-${rowIndex}-${colIndex}`}
                  width="100%"
                  height="16px"
                  className="flex-1"
                  data-testid={`skeleton-table-cell-${rowIndex}-${colIndex}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }
);

SkeletonTable.displayName = 'SkeletonTable';

export default SkeletonTable;
