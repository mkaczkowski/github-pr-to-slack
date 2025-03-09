import React from 'react';
import classNames from 'classnames';
import styles from './StatusMessage.module.css';

export interface StatusMessageProps {
  message: string;
  type: 'success' | 'error' | 'warning' | '';
}

const StatusMessage: React.FC<StatusMessageProps> = ({ message, type }) => {
  return (
    <div
      className={classNames(styles.statusMessage, {
        [styles.success]: type === 'success',
        [styles.error]: type === 'error',
        [styles.warning]: type === 'warning',
      })}
    >
      <span>{message}</span>
    </div>
  );
};

export default StatusMessage;
