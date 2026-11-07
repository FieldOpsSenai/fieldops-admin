import React from 'react';
import { render, screen } from '@testing-library/react';
import Button from '../Button';
import Input from '../Input';
import Badge from '../Badge';
import Select from '../Select';
import Textarea from '../Textarea';

describe('UI Components', () => {
  describe('Button', () => {
    test('renders button with children', () => {
      render(<Button>Click me</Button>);
      expect(screen.getByText('Click me')).toBeInTheDocument();
    });

    test('renders button with primary intent by default', () => {
      const { container } = render(<Button>Primary</Button>);
      const button = container.querySelector('button');
      expect(button).toHaveClass('bg-blue-600');
    });

    test('renders button with secondary intent', () => {
      const { container } = render(<Button intent="secondary">Secondary</Button>);
      const button = container.querySelector('button');
      expect(button).toHaveClass('bg-gray-200');
    });

    test('renders button with danger intent', () => {
      const { container } = render(<Button intent="danger">Danger</Button>);
      const button = container.querySelector('button');
      expect(button).toHaveClass('bg-red-600');
    });

    test('renders button with md size by default', () => {
      const { container } = render(<Button>Medium</Button>);
      const button = container.querySelector('button');
      expect(button).toHaveClass('px-4');
      expect(button).toHaveClass('py-2');
    });

    test('renders button with sm size', () => {
      const { container } = render(<Button size="sm">Small</Button>);
      const button = container.querySelector('button');
      expect(button).toHaveClass('px-3');
      expect(button).toHaveClass('py-1.5');
    });

    test('renders button with lg size', () => {
      const { container } = render(<Button size="lg">Large</Button>);
      const button = container.querySelector('button');
      expect(button).toHaveClass('px-6');
      expect(button).toHaveClass('py-3');
    });

    test('button supports disabled state', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByText('Disabled') as HTMLButtonElement;
      expect(button.disabled).toBe(true);
    });

    test('button supports aria attributes', () => {
      render(<Button aria-label="Test button">Aria Test</Button>);
      const button = screen.getByLabelText('Test button');
      expect(button).toBeInTheDocument();
    });
  });

  describe('Input', () => {
    test('renders input element', () => {
      render(<Input id="test-input" />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    test('input supports placeholder', () => {
      render(<Input placeholder="Enter text" />);
      expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
    });

    test('input supports error state', () => {
      const { container } = render(<Input id="test" error />);
      const input = container.querySelector('input');
      expect(input).toHaveClass('border-red-500');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    test('input displays helper text', () => {
      render(<Input id="test" helperText="This is a helper text" />);
      expect(screen.getByText('This is a helper text')).toBeInTheDocument();
    });

    test('input supports disabled state', () => {
      render(<Input disabled />);
      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.disabled).toBe(true);
    });

    test('input with md size by default', () => {
      const { container } = render(<Input />);
      const input = container.querySelector('input');
      expect(input).toHaveClass('px-3');
      expect(input).toHaveClass('py-2');
    });

    test('input supports sm size', () => {
      const { container } = render(<Input size="sm" />);
      const input = container.querySelector('input');
      expect(input).toHaveClass('px-2.5');
      expect(input).toHaveClass('py-1.5');
    });

    test('input supports lg size', () => {
      const { container } = render(<Input size="lg" />);
      const input = container.querySelector('input');
      expect(input).toHaveClass('px-4');
      expect(input).toHaveClass('py-3');
    });
  });

  describe('Badge', () => {
    test('renders badge with children', () => {
      render(<Badge>Success</Badge>);
      expect(screen.getByText('Success')).toBeInTheDocument();
    });

    test('badge has success variant', () => {
      const { container } = render(<Badge variant="success">Success</Badge>);
      const badge = container.querySelector('[role="status"]');
      expect(badge).toHaveClass('bg-green-100');
      expect(badge).toHaveClass('text-green-800');
    });

    test('badge has warning variant', () => {
      const { container } = render(<Badge variant="warning">Warning</Badge>);
      const badge = container.querySelector('[role="status"]');
      expect(badge).toHaveClass('bg-yellow-100');
      expect(badge).toHaveClass('text-yellow-800');
    });

    test('badge has error variant', () => {
      const { container } = render(<Badge variant="error">Error</Badge>);
      const badge = container.querySelector('[role="status"]');
      expect(badge).toHaveClass('bg-red-100');
      expect(badge).toHaveClass('text-red-800');
    });

    test('badge has info variant by default', () => {
      const { container } = render(<Badge>Info</Badge>);
      const badge = container.querySelector('[role="status"]');
      expect(badge).toHaveClass('bg-blue-100');
      expect(badge).toHaveClass('text-blue-800');
    });

    test('badge has role status', () => {
      render(<Badge>Status Badge</Badge>);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('Select', () => {
    const options = [
      { value: '1', label: 'Option 1' },
      { value: '2', label: 'Option 2' },
      { value: '3', label: 'Option 3' },
    ];

    test('renders select element', () => {
      render(<Select options={options} />);
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    test('renders all options', () => {
      render(<Select options={options} />);
      expect(screen.getByText('Option 1')).toBeInTheDocument();
      expect(screen.getByText('Option 2')).toBeInTheDocument();
      expect(screen.getByText('Option 3')).toBeInTheDocument();
    });

    test('renders placeholder option', () => {
      render(<Select options={options} placeholder="Select an option" />);
      expect(screen.getByText('Select an option')).toBeInTheDocument();
    });

    test('select supports error state', () => {
      const { container } = render(<Select options={options} error />);
      const select = container.querySelector('select');
      expect(select).toHaveClass('border-red-500');
      expect(select).toHaveAttribute('aria-invalid', 'true');
    });

    test('select supports disabled state', () => {
      render(<Select options={options} disabled />);
      const select = screen.getByRole('combobox') as HTMLSelectElement;
      expect(select.disabled).toBe(true);
    });

    test('select with sm size', () => {
      const { container } = render(<Select options={options} size="sm" />);
      const select = container.querySelector('select');
      expect(select).toHaveClass('px-2.5');
    });
  });

  describe('Textarea', () => {
    test('renders textarea element', () => {
      render(<Textarea id="test-textarea" />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    test('textarea supports placeholder', () => {
      render(<Textarea placeholder="Enter text" />);
      expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
    });

    test('textarea supports error state', () => {
      const { container } = render(<Textarea id="test" error />);
      const textarea = container.querySelector('textarea');
      expect(textarea).toHaveClass('border-red-500');
      expect(textarea).toHaveAttribute('aria-invalid', 'true');
    });

    test('textarea displays helper text', () => {
      render(<Textarea id="test" helperText="Help text here" />);
      expect(screen.getByText('Help text here')).toBeInTheDocument();
    });

    test('textarea supports disabled state', () => {
      render(<Textarea disabled />);
      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      expect(textarea.disabled).toBe(true);
    });

    test('textarea with md size by default', () => {
      const { container } = render(<Textarea />);
      const textarea = container.querySelector('textarea');
      expect(textarea).toHaveClass('px-3');
      expect(textarea).toHaveClass('py-2');
    });

    test('textarea supports sm size', () => {
      const { container } = render(<Textarea size="sm" />);
      const textarea = container.querySelector('textarea');
      expect(textarea).toHaveClass('px-2.5');
    });

    test('textarea supports lg size', () => {
      const { container } = render(<Textarea size="lg" />);
      const textarea = container.querySelector('textarea');
      expect(textarea).toHaveClass('px-4');
      expect(textarea).toHaveClass('py-3');
    });
  });
});
