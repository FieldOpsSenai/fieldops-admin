# Primitive UI Components Guide

This directory contains reusable, accessible UI components built with React, TypeScript, and Tailwind CSS.

## Components

### Button
- **Path**: `Button.tsx`
- **Variants**:
  - **Intent**: `primary`, `secondary`, `danger`
  - **Size**: `sm`, `md` (default), `lg`
- **Features**:
  - Full keyboard support
  - Focus-visible ring for accessibility
  - Disabled state support
  - Supports all standard button HTML attributes
  - Ref forwarding for programmatic access
- **Example**:
  ```tsx
  <Button intent="primary" size="md">Click me</Button>
  <Button intent="danger" disabled>Delete</Button>
  ```

### Input
- **Path**: `Input.tsx`
- **Variants**:
  - **Size**: `sm`, `md` (default), `lg`
  - **States**: default, error, disabled
- **Features**:
  - Error state with `aria-invalid`
  - Helper text support with `aria-describedby`
  - Full keyboard support
  - Disabled state
  - Responsive sizing
  - Focus ring styling
- **Example**:
  ```tsx
  <Input placeholder="Enter text" />
  <Input error helperText="This field is required" />
  <Input size="lg" disabled />
  ```

### Badge
- **Path**: `Badge.tsx`
- **Variants**:
  - **Variant**: `success`, `warning`, `error`, `info` (default)
- **Features**:
  - Status role for screen readers
  - Color-coded variants for quick visual feedback
  - Responsive sizing with Tailwind
  - Accessibility compliant
- **Example**:
  ```tsx
  <Badge variant="success">Active</Badge>
  <Badge variant="error">Failed</Badge>
  <Badge variant="warning">Pending</Badge>
  ```

### Select
- **Path**: `Select.tsx`
- **Variants**:
  - **Size**: `sm`, `md` (default), `lg`
  - **States**: default, error, disabled
- **Features**:
  - Native select element (keyboard accessible by default)
  - Placeholder option support
  - Error state with `aria-invalid`
  - Disabled options support
  - Custom chevron icon
  - Type-safe options interface
- **Example**:
  ```tsx
  const options = [
    { value: '1', label: 'Option 1' },
    { value: '2', label: 'Option 2' },
  ];
  <Select options={options} placeholder="Choose..." />
  <Select options={options} error />
  ```

### Textarea
- **Path**: `Textarea.tsx`
- **Variants**:
  - **Size**: `sm`, `md` (default), `lg`
  - **States**: default, error, disabled
- **Features**:
  - Multi-line text input
  - Error state with `aria-invalid`
  - Helper text support with `aria-describedby`
  - Resizable (vertical only by default)
  - Disabled state
  - Full keyboard support
- **Example**:
  ```tsx
  <Textarea placeholder="Enter description" />
  <Textarea error helperText="Maximum 500 characters" />
  <Textarea size="lg" />
  ```

## Accessibility Features

All components include:
- **ARIA Attributes**: Proper use of `aria-invalid`, `aria-describedby`, `aria-hidden` where applicable
- **Keyboard Support**: Full keyboard navigation and interaction
- **Focus Management**: Visible focus rings for keyboard users (`focus-visible:ring-2`)
- **Semantic HTML**: Using proper HTML elements (`button`, `input`, `select`, `textarea`)
- **Color Contrast**: Tailwind colors ensure WCAG AA compliance
- **Role Attributes**: Proper semantic roles (e.g., `role="status"` for badges)

## Styling with Tailwind CSS

All components use Tailwind CSS with the following approach:
- **Utility Classes**: Direct Tailwind utilities for styling
- **Responsive Design**: Mobile-first responsive classes
- **Dark Mode Ready**: Uses color names that can be extended for dark mode
- **Customizable**: Accept `className` prop for additional styling

## TypeScript Support

All components are fully typed:
- Props interfaces exported for better DX
- Proper HTML attribute extension (excluding conflicting ones like `size`)
- Ref forwarding for class component patterns
- Type-safe options for Select component

## Composition

Import components from the barrel export:

```tsx
import { Button, Input, Badge, Select, Textarea } from '@/components/ui';
```

Or import individually:

```tsx
import Button from '@/components/ui/Button';
import { SelectOption } from '@/components/ui/Select';
```

## Future Enhancements

- [ ] Add size animations
- [ ] Add loading states
- [ ] Add validation patterns for Input/Textarea
- [ ] Add icon support for Button
- [ ] Add multi-select option
- [ ] Create composed components (FormGroup, FieldSet)
- [ ] Add form context provider
