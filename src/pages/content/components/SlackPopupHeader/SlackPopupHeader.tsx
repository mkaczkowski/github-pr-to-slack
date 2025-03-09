import React from 'react';
import styles from './SlackPopupHeader.module.css';

interface SlackPopupHeaderProps {
  onClose: () => void;
}

/**
 * SlackPopupHeader component for the header section of SlackPopup
 */
export const SlackPopupHeader: React.FC<SlackPopupHeaderProps> = React.memo(({ onClose }) => {
  return (
    <div className={styles.header}>
      <h2 className={styles.title}>Send PR to Slack</h2>
      <button className={styles.closeButton} onClick={onClose} aria-label="Close popup">
        ×
      </button>
    </div>
  );
});

SlackPopupHeader.displayName = 'SlackPopupHeader';

export default SlackPopupHeader;
