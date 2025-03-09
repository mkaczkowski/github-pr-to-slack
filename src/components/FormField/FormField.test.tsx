import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import FormField from './FormField';

describe('FormField', () => {
  it('renders an input field with label', () => {
    render(<FormField id="test-field" label="Test Label" />);

    expect(screen.getByLabelText('Test Label')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveAttribute('id', 'test-field');
  });

  it('renders without a label when not provided', () => {
    render(<FormField id="test-field" />);

    expect(screen.queryByRole('label')).not.toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveAttribute('id', 'test-field');
  });

  it('renders a textarea when type is textarea', () => {
    render(<FormField id="test-area" label="Test Area" type="textarea" />);

    const textarea = screen.getByLabelText('Test Area');
    expect(textarea).toBeInTheDocument();
    expect(textarea.tagName).toBe('TEXTAREA');
  });

  it('renders with an error message when provided', () => {
    render(<FormField id="test-field" label="Test Label" error="This field is required" />);

    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  it('applies additional input props', () => {
    render(
      <FormField
        id="test-field"
        label="Test Label"
        inputProps={{
          placeholder: 'Enter value',
          disabled: true,
          className: 'custom-class',
        }}
      />,
    );

    const input = screen.getByLabelText('Test Label');
    expect(input).toHaveAttribute('placeholder', 'Enter value');
    expect(input).toBeDisabled();
    // Check if the class is applied (implementation may vary)
    expect(input.className).toContain('custom-class');
  });

  it('applies additional textarea props', () => {
    render(
      <FormField
        id="test-area"
        label="Test Area"
        type="textarea"
        textareaProps={{
          placeholder: 'Enter text',
          rows: 5,
          className: 'custom-area',
        }}
      />,
    );

    const textarea = screen.getByLabelText('Test Area');
    expect(textarea).toHaveAttribute('placeholder', 'Enter text');
    expect(textarea).toHaveAttribute('rows', '5');
    expect(textarea.className).toContain('custom-area');
  });

  it('calls onChange handler when input value changes', () => {
    const handleChange = vi.fn();
    render(<FormField id="test-field" label="Test Label" onChange={handleChange} />);

    const input = screen.getByLabelText('Test Label');
    fireEvent.change(input, { target: { value: 'new value' } });

    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it('calls onBlur handler when input loses focus', () => {
    const handleBlur = vi.fn();
    render(<FormField id="test-field" label="Test Label" onBlur={handleBlur} />);

    const input = screen.getByLabelText('Test Label');
    fireEvent.blur(input);

    expect(handleBlur).toHaveBeenCalledTimes(1);
  });

  it('forwards ref to the input element', () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<FormField id="test-field" label="Test Label" ref={ref} />);

    expect(ref.current).not.toBeNull();
    expect(ref.current?.id).toBe('test-field');
  });

  it('forwards ref to the textarea element when type is textarea', () => {
    const ref = React.createRef<HTMLTextAreaElement>();
    render(<FormField id="test-area" label="Test Area" type="textarea" ref={ref} />);

    expect(ref.current).not.toBeNull();
    expect(ref.current?.id).toBe('test-area');
  });

  it('applies name attribute when provided', () => {
    render(<FormField id="test-field" label="Test Label" name="fieldName" />);

    const input = screen.getByLabelText('Test Label');
    expect(input).toHaveAttribute('name', 'fieldName');
  });

  it('applies value when provided', () => {
    render(<FormField id="test-field" label="Test Label" value="Initial value" />);

    const input = screen.getByLabelText('Test Label');
    expect(input).toHaveValue('Initial value');
  });

  it('applies different input types', () => {
    render(<FormField id="test-field" label="Test Label" type="password" />);

    const input = screen.getByLabelText('Test Label');
    expect(input).toHaveAttribute('type', 'password');
  });

  it('applies additional props to the input', () => {
    render(<FormField id="test-field" label="Test Label" data-testid="custom-test-id" />);

    const input = screen.getByLabelText('Test Label');
    expect(input).toHaveAttribute('data-testid', 'custom-test-id');
  });
});
