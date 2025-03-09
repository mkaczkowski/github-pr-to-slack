import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useFormValidation } from './useFormValidation';

describe('useFormValidation', () => {
  it('should initialize with empty errors by default', () => {
    const { result } = renderHook(() => useFormValidation());
    expect(result.current.fieldErrors).toEqual({});
    expect(result.current.hasErrors()).toBe(false);
  });

  it('should initialize with provided errors', () => {
    const initialErrors = { name: 'Name is required' };
    const { result } = renderHook(() => useFormValidation(initialErrors));
    expect(result.current.fieldErrors).toEqual(initialErrors);
    expect(result.current.hasErrors()).toBe(true);
  });

  it('should validate required fields correctly', () => {
    const { result } = renderHook(() => useFormValidation());

    // Test with empty value
    act(() => {
      const isValid = result.current.validateRequired('name', '');
      expect(isValid).toBe(false);
    });
    expect(result.current.fieldErrors).toHaveProperty('name');
    expect(result.current.hasErrors()).toBe(true);

    // Test with whitespace value
    act(() => {
      const isValid = result.current.validateRequired('email', '   ');
      expect(isValid).toBe(false);
    });
    expect(result.current.fieldErrors).toHaveProperty('email');

    // Test with valid value
    act(() => {
      const isValid = result.current.validateRequired('message', 'Hello');
      expect(isValid).toBe(true);
    });
    expect(result.current.fieldErrors).not.toHaveProperty('message');
  });

  it('should validate with custom error message', () => {
    const { result } = renderHook(() => useFormValidation());
    const customError = 'Custom error message';

    act(() => {
      result.current.validateRequired('field', '', customError);
    });

    expect(result.current.fieldErrors.field).toBe(customError);
  });

  it('should set error correctly', () => {
    const { result } = renderHook(() => useFormValidation());

    act(() => {
      result.current.setError('name', 'Invalid name');
    });

    expect(result.current.fieldErrors.name).toBe('Invalid name');
    expect(result.current.hasErrors()).toBe(true);
  });

  it('should clear error correctly', () => {
    const initialErrors = { name: 'Name is required', email: 'Email is required' };
    const { result } = renderHook(() => useFormValidation(initialErrors));

    act(() => {
      result.current.clearError('name');
    });

    expect(result.current.fieldErrors).not.toHaveProperty('name');
    expect(result.current.fieldErrors).toHaveProperty('email');
    expect(result.current.hasErrors()).toBe(true);
  });

  it('should clear all errors correctly', () => {
    const initialErrors = { name: 'Name is required', email: 'Email is required' };
    const { result } = renderHook(() => useFormValidation(initialErrors));

    act(() => {
      result.current.clearAllErrors();
    });

    expect(result.current.fieldErrors).toEqual({});
    expect(result.current.hasErrors()).toBe(false);
  });

  it('should set field errors directly', () => {
    const { result } = renderHook(() => useFormValidation());
    const newErrors = { field1: 'Error 1', field2: 'Error 2' };

    act(() => {
      result.current.setFieldErrors(newErrors);
    });

    expect(result.current.fieldErrors).toEqual(newErrors);
  });

  it('should handle multiple operations correctly', () => {
    const { result } = renderHook(() => useFormValidation());

    // Add multiple errors
    act(() => {
      result.current.setError('name', 'Name error');
      result.current.setError('email', 'Email error');
      result.current.setError('password', 'Password error');
    });

    expect(Object.keys(result.current.fieldErrors).length).toBe(3);

    // Clear one error
    act(() => {
      result.current.clearError('email');
    });

    expect(Object.keys(result.current.fieldErrors).length).toBe(2);
    expect(result.current.fieldErrors).not.toHaveProperty('email');

    // Validate a field (should clear its error if valid)
    act(() => {
      result.current.validateRequired('name', 'John');
    });

    expect(Object.keys(result.current.fieldErrors).length).toBe(1);
    expect(result.current.fieldErrors).not.toHaveProperty('name');
    expect(result.current.fieldErrors).toHaveProperty('password');

    // Clear all remaining errors
    act(() => {
      result.current.clearAllErrors();
    });

    expect(result.current.fieldErrors).toEqual({});
    expect(result.current.hasErrors()).toBe(false);
  });
});
