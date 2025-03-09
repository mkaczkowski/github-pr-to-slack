import React, { TextareaHTMLAttributes, forwardRef, Ref, useCallback } from 'react';
import classNames from 'classnames';
import { useCombinedRefs } from '../../hooks/useCombinedRefs';
import styles from './TextArea.module.css';

interface FormTextAreaProps {
  id: string;
  label?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
  error?: string;
  textareaProps?: TextareaHTMLAttributes<HTMLTextAreaElement> & {
    ref?: Ref<HTMLTextAreaElement>;
  };
  name?: string;
}

export const TextArea = forwardRef<HTMLTextAreaElement, FormTextAreaProps>(
  ({ id, label, value, onChange, onBlur, error, textareaProps = {}, name }, ref) => {
    const { ref: textareaPropsRef, ...restTextareaProps } = textareaProps;

    const combinedRef = useCombinedRefs(ref, textareaPropsRef);

    // Create a memoized onChange handler to prevent unnecessary re-renders
    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        // Ensure the event is not being reused
        e.persist();

        // Call the parent's onChange handler if provided
        if (onChange) {
          onChange(e);
        }

        // Call the textareaProps onChange if provided
        if (restTextareaProps.onChange) {
          // Cast to any to avoid TypeScript errors with event types
          const onChangeHandler = restTextareaProps.onChange as (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
          onChangeHandler(e);
        }
      },
      [onChange, restTextareaProps],
    );

    return (
      <div className={styles.formGroup}>
        {label && (
          <label htmlFor={id} className={styles.label}>
            {label}
          </label>
        )}
        <textarea
          id={id}
          value={value}
          onChange={handleChange}
          onBlur={onBlur}
          className={classNames(styles.textarea, { [styles.error]: error }, restTextareaProps.className)}
          ref={combinedRef}
          name={name}
          {...restTextareaProps}
        />
        {error && <div className={styles.errorMessage}>{error}</div>}
      </div>
    );
  },
);

TextArea.displayName = 'TextArea';

export default TextArea;
