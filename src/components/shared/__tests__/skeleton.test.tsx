import React from 'react';
import { render, screen } from '@testing-library/react';
import SkeletonBox from '../SkeletonBox';
import SkeletonText from '../SkeletonText';
import SkeletonCircle from '../SkeletonCircle';
import SkeletonTable from '../SkeletonTable';

describe('Skeleton Components', () => {
  describe('SkeletonBox', () => {
    test('renders with default props', () => {
      render(<SkeletonBox />);
      const skeleton = screen.getByTestId('skeleton-box');
      expect(skeleton).toBeInTheDocument();
    });

    test('renders with custom width and height', () => {
      render(<SkeletonBox width="200px" height="50px" />);
      const skeleton = screen.getByTestId('skeleton-box');
      expect(skeleton).toBeInTheDocument();
    });

    test('has pulse animation class', () => {
      render(<SkeletonBox />);
      const skeleton = screen.getByTestId('skeleton-box');
      expect(skeleton.className).toContain('animate-pulse');
    });
  });

  describe('SkeletonText', () => {
    test('renders multiple lines by default', () => {
      render(<SkeletonText />);
      const lines = screen.getAllByRole('status');
      expect(lines.length).toBe(3); // Default 3 lines
    });

    test('renders custom number of lines', () => {
      render(<SkeletonText lines={5} />);
      const lines = screen.getAllByTestId(/skeleton-text-line/);
      expect(lines.length).toBe(5);
    });

    test('renders with different line heights', () => {
      render(<SkeletonText lines={1} lineHeight="lg" />);
      const line = screen.getByTestId('skeleton-text-line-0');
      expect(line.className).toContain('h-5');
    });
  });

  describe('SkeletonCircle', () => {
    test('renders with default size', () => {
      render(<SkeletonCircle />);
      const skeleton = screen.getByTestId('skeleton-circle');
      expect(skeleton).toBeInTheDocument();
    });

    test('renders different sizes', () => {
      const { rerender } = render(<SkeletonCircle size="sm" />);
      let skeleton = screen.getByTestId('skeleton-circle');
      expect(skeleton.className).toContain('w-8');

      rerender(<SkeletonCircle size="lg" />);
      skeleton = screen.getByTestId('skeleton-circle');
      expect(skeleton.className).toContain('w-16');
    });

    test('has pulse animation class', () => {
      render(<SkeletonCircle />);
      const skeleton = screen.getByTestId('skeleton-circle');
      expect(skeleton.className).toContain('animate-pulse');
    });
  });

  describe('SkeletonTable', () => {
    test('renders with specified column count', () => {
      render(<SkeletonTable columnCount={3} rowCount={2} />);
      const table = screen.getByTestId('skeleton-table');
      expect(table).toBeInTheDocument();
    });

    test('renders correct number of rows', () => {
      render(<SkeletonTable columnCount={3} rowCount={4} />);
      const rows = screen.getAllByTestId(/skeleton-table-row/);
      expect(rows.length).toBe(4);
    });

    test('renders header row', () => {
      render(<SkeletonTable columnCount={3} rowCount={2} />);
      const headerCells = screen.getAllByTestId(/skeleton-table-header/);
      expect(headerCells.length).toBe(3);
    });

    test('renders correct number of cells per row', () => {
      render(<SkeletonTable columnCount={5} rowCount={2} />);
      const cells = screen.getAllByTestId(/skeleton-table-cell/);
      // 2 rows * 5 columns = 10 cells
      expect(cells.length).toBe(10);
    });

    test('uses default row count of 5', () => {
      render(<SkeletonTable columnCount={3} />);
      const rows = screen.getAllByTestId(/skeleton-table-row/);
      expect(rows.length).toBe(5);
    });
  });
});
