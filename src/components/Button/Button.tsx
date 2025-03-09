import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import classNames from 'classnames';
import styles from './Button.module.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  isLoading?: boolean;
  buttonProps?: Record<string, unknown>;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      type = 'button',
      variant = 'primary',
      isLoading = false,
      disabled = false,
      onClick,
      children,
      className = '',
      buttonProps = {},
      ...rest
    },
    ref,
  ) => {
    const buttonClasses = classNames(
      styles.button,
      styles[variant],
      {
        [styles.loading]: isLoading,
      },
      className,
    );

    return (
      <button
        type={type}
        className={buttonClasses}
        disabled={disabled || isLoading}
        onClick={onClick}
        ref={ref}
        {...buttonProps}
        {...rest}
      >
        {isLoading && <span className={styles.spinner} aria-hidden="true"></span>}
        <span className={classNames({ [styles.textWithSpinner]: isLoading })}>{children}</span>
      </button>
    );
  },
);

Button.displayName = 'Button';
