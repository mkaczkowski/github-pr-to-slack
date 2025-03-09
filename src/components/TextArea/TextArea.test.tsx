import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TextArea from './TextArea';

describe('TextArea', () => {
  it('renders a textarea with label', () => {
    render(<TextArea id="test-area" label="Test Label" />);

    expect(screen.getByLabelText('Test Label')).toBeInTheDocument();
    const textarea = screen.getByLabelText('Test Label');
    expect(textarea.tagName).toBe('TEXTAREA');
    expect(textarea).toHaveAttribute('id', 'test-area');
  });

  it('renders without a label when not provided', () => {
    render(<TextArea id="test-area" />);

    expect(screen.queryByRole('label')).not.toBeInTheDocument();
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('id', 'test-area');
  });

  it('renders with an error message when provided', () => {
    render(<TextArea id="test-area" label="Test Label" error="This field is required" />);

    expect(screen.getByText('This field is required')).toBeInTheDocument();
    // Check if error class is applied
    const textarea = screen.getByLabelText('Test Label');
    expect(textarea.className).toContain('error');
  });

  it('applies additional textarea props', () => {
    render(
      <TextArea
        id="test-area"
        label="Test Label"
        textareaProps={{
          placeholder: 'Enter text',
          rows: 5,
          className: 'custom-area',
          maxLength: 100,
        }}
      />,
    );

    const textarea = screen.getByLabelText('Test Label');
    expect(textarea).toHaveAttribute('placeholder', 'Enter text');
    expect(textarea).toHaveAttribute('rows', '5');
    expect(textarea).toHaveAttribute('maxLength', '100');
    expect(textarea.className).toContain('custom-area');
  });

  it('calls onChange handler when textarea value changes', () => {
    const handleChange = vi.fn();
    render(<TextArea id="test-area" label="Test Label" onChange={handleChange} />);

    const textarea = screen.getByLabelText('Test Label');
    fireEvent.change(textarea, { target: { value: 'new value' } });

    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it.skip('calls both component and prop onChange handlers', () => {
    const componentOnChange = vi.fn();
    const propsOnChange = vi.fn();

    // Create a mock event that will be passed to both handlers
    const mockEvent = {
      target: { value: 'new value' },
      persist: vi.fn(),
    } as unknown as React.ChangeEvent<HTMLTextAreaElement>;

    // Render the component with both handlers
    render(
      <TextArea
        id="test-area"
        onChange={componentOnChange}
        textareaProps={{
          onChange: propsOnChange,
        }}
      />,
    );

    // Get the textarea element
    const textarea = screen.getByRole('textbox');

    // Manually trigger the change event
    fireEvent.change(textarea, { target: { value: 'new value' } });

    // Both handlers should be called
    expect(componentOnChange).toHaveBeenCalled();
    expect(propsOnChange).toHaveBeenCalled();
  });

  it('calls onBlur handler when textarea loses focus', () => {
    const handleBlur = vi.fn();
    render(<TextArea id="test-area" label="Test Label" onBlur={handleBlur} />);

    const textarea = screen.getByLabelText('Test Label');
    fireEvent.blur(textarea);

    expect(handleBlur).toHaveBeenCalledTimes(1);
  });

  it('forwards ref to the textarea element', () => {
    const ref = React.createRef<HTMLTextAreaElement>();
    render(<TextArea id="test-area" label="Test Label" ref={ref} />);

    expect(ref.current).not.toBeNull();
    expect(ref.current?.id).toBe('test-area');
  });

  it('applies name attribute when provided', () => {
    render(<TextArea id="test-area" label="Test Label" name="areaName" />);

    const textarea = screen.getByLabelText('Test Label');
    expect(textarea).toHaveAttribute('name', 'areaName');
  });

  it('applies value when provided', () => {
    render(<TextArea id="test-area" label="Test Label" value="Initial value" />);

    const textarea = screen.getByLabelText('Test Label');
    expect(textarea).toHaveValue('Initial value');
  });

  it('persists the event in onChange handler', () => {
    const handleChange = vi.fn((e) => {
      // If e.persist was not called, accessing e.target after the event
      // would throw an error in a real React environment
      const value = e.target.value;
      expect(value).toBe('new value');
    });

    render(<TextArea id="test-area" label="Test Label" onChange={handleChange} />);

    const textarea = screen.getByLabelText('Test Label');
    fireEvent.change(textarea, { target: { value: 'new value' } });

    expect(handleChange).toHaveBeenCalledTimes(1);
  });
});
