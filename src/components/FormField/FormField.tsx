import React, { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef, Ref, useCallback } from 'react';
import classNames from 'classnames';
import { useCombinedRefs } from '../../hooks/useCombinedRefs';
import styles from './FormField.module.css';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  ref?: Ref<HTMLInputElement>;
  className?: string;
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  ref?: Ref<HTMLTextAreaElement>;
  className?: string;
}

interface FormFieldProps {
  id: string;
  label?: string;
  type?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  error?: string;
  inputProps?: InputProps;
  textareaProps?: TextareaProps;
  name?: string;
  [key: string]: any; // Allow additional props for react-hook-form
}

export const FormField = forwardRef<HTMLInputElement | HTMLTextAreaElement, FormFieldProps>(
  (
    { id, label, type = 'text', value, onChange, onBlur, error, inputProps = {}, textareaProps = {}, name, ...rest },
    ref,
  ) => {
    const isTextarea = type === 'textarea';

    const { ref: inputPropsRef, ...restInputProps } = inputProps;
    const { ref: textareaPropsRef, ...restTextareaProps } = textareaProps;

    const combinedInputRef = useCombinedRefs(isTextarea ? null : ref, inputPropsRef);
    const combinedTextareaRef = useCombinedRefs(isTextarea ? ref : null, textareaPropsRef);

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        e.persist();

        if (onChange) {
          onChange(e);
        }
      },
      [onChange],
    );

    return (
      <div className={classNames(styles.formField, { [styles.hasError]: error })}>
        {label && (
          <label htmlFor={id} className={styles.formFieldLabel}>
            {label}
          </label>
        )}
        <div className={styles.inputContainer}>
          {isTextarea ? (
            <textarea
              id={id}
              value={value}
              onChange={handleChange as (e: React.ChangeEvent<HTMLTextAreaElement>) => void}
              onBlur={onBlur as (e: React.FocusEvent<HTMLTextAreaElement>) => void}
              className={classNames(styles.textarea, restTextareaProps.className)}
              ref={combinedTextareaRef as Ref<HTMLTextAreaElement>}
              name={name}
              autoComplete="off"
              {...restTextareaProps}
              {...rest}
            />
          ) : (
            <input
              id={id}
              type={type}
              value={value}
              onChange={handleChange}
              onBlur={onBlur as (e: React.FocusEvent<HTMLInputElement>) => void}
              className={classNames(styles.input, restInputProps.className)}
              ref={combinedInputRef as Ref<HTMLInputElement>}
              name={name}
              autoComplete="off"
              {...restInputProps}
              {...rest}
            />
          )}
          {error && <div className={styles.errorMessage}>{error}</div>}
        </div>
      </div>
    );
  },
);

FormField.displayName = 'FormField';

export default FormField;
