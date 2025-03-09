import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import classNames from 'classnames';
import { Button } from '../../../../components/Button/Button';
import styles from './SlackButton.module.css';

interface SlackButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
}

export const SlackButton = React.memo(
  forwardRef<HTMLButtonElement, SlackButtonProps>(
    (
      { onClick, disabled = false, isLoading = false, className = '', children = 'Send to Slack', ...buttonProps },
      ref,
    ) => {
      return (
        <Button
          variant="primary"
          className={classNames(styles.button, className)}
          onClick={onClick}
          disabled={disabled}
          isLoading={isLoading}
          ref={ref}
          {...buttonProps}
        >
          <span className={styles.text}>{children}</span>
        </Button>
      );
    },
  ),
);

SlackButton.displayName = 'SlackButton';

export default SlackButton;
