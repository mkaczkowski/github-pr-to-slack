import { useState } from 'react';

interface FormErrors {
  [key: string]: string;
}

export const useFormValidation = (initialErrors: FormErrors = {}) => {
  const [fieldErrors, setFieldErrors] = useState<FormErrors>(initialErrors);

  const validateRequired = (fieldName: string, value: string, errorMessage = 'This field is required'): boolean => {
    if (!value || value.trim() === '') {
      setFieldErrors((prev) => ({
        ...prev,
        [fieldName]: errorMessage,
      }));
      return false;
    }

    clearError(fieldName);
    return true;
  };

  const setError = (fieldName: string, errorMessage: string): void => {
    setFieldErrors((prev) => ({
      ...prev,
      [fieldName]: errorMessage,
    }));
  };

  const clearError = (fieldName: string): void => {
    setFieldErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  };

  const clearAllErrors = (): void => {
    setFieldErrors({});
  };

  const hasErrors = (): boolean => {
    return Object.keys(fieldErrors).length > 0;
  };

  return {
    fieldErrors,
    setFieldErrors,
    validateRequired,
    setError,
    clearError,
    clearAllErrors,
    hasErrors,
  };
};
