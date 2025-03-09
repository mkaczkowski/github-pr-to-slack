import React, { ForwardedRef } from 'react';
import { Button } from '../../../../components/Button/Button';
import SlackButton from '../SlackButton/SlackButton';
import styles from './SlackPopupFooter.module.css';

interface SlackPopupFooterProps {
  handleCopyToClipboard: () => Promise<void>;
  handleSendToSlack: () => Promise<void>;
  isSending: boolean;
  isConfigured: boolean;
  slackButtonRef?: React.RefObject<HTMLButtonElement>;
}

/**
 * SlackPopupFooter component for the footer section of SlackPopup
 */
export const SlackPopupFooter: React.FC<SlackPopupFooterProps> = React.memo(
  ({ handleCopyToClipboard, handleSendToSlack, isSending, isConfigured, slackButtonRef }) => {
    return (
      <div className={styles.footer}>
        <Button onClick={handleCopyToClipboard} variant="secondary" disabled={isSending}>
          Copy to Clipboard
        </Button>

        {isConfigured && (
          <SlackButton
            onClick={handleSendToSlack}
            isLoading={isSending}
            disabled={isSending}
            ref={slackButtonRef as unknown as ForwardedRef<HTMLButtonElement>}
          >
            Send
          </SlackButton>
        )}
      </div>
    );
  },
);

SlackPopupFooter.displayName = 'SlackPopupFooter';

export default SlackPopupFooter;
