import React, { RefObject } from 'react';
import { useFormContext } from 'react-hook-form';
import { Button } from '../../../../components/Button/Button';
import FormField from '../../../../components/FormField/FormField';
import StatusMessage from '../../../../components/StatusMessage/StatusMessage';
import TextArea from '../../../../components/TextArea/TextArea';
import { SlackFormValues } from '../../types/form';
import styles from './SlackPopupContent.module.css';

interface SlackStatusMessage {
  text: string;
  type: string;
}

interface SlackPopupContentProps {
  statusMessage: SlackStatusMessage;
  setStatusMessage: React.Dispatch<React.SetStateAction<SlackStatusMessage>>;
  isConfigured: boolean;
  openOptions: () => void;
}

/**
 * SlackPopupContent component for the content section of SlackPopup
 */
export const SlackPopupContent: React.FC<SlackPopupContentProps> = React.memo(
  ({ statusMessage, setStatusMessage, isConfigured, openOptions }) => {
    // Get form context from react-hook-form
    const {
      register,
      watch,
      formState: { errors },
    } = useFormContext<SlackFormValues>();

    return (
      <div className={styles.content}>
        {statusMessage.text && (
          <StatusMessage
            message={statusMessage.text}
            type={statusMessage.type as 'success' | 'error' | 'warning' | ''}
          />
        )}

        {!isConfigured && (
          <div className={styles.formGroup}>
            <p>
              You need to configure your Slack webhook URL before you can send messages.{' '}
              <Button variant="secondary" onClick={openOptions}>
                Open Options
              </Button>
            </p>
          </div>
        )}

        {isConfigured && (
          <>
            <div className={styles.formGroup}>
              <label htmlFor="channel">Channel or User</label>
              <FormField
                id="channel"
                {...register('channel')}
                error={errors.channel?.message}
                // ref={channelInputRef}
                inputProps={{
                  placeholder: 'e.g. #general or @username',
                }}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="message">Message</label>
              <TextArea
                id="message"
                {...register('message')}
                error={errors.message?.message}
                // ref={messageTextareaRef}
                textareaProps={{
                  rows: 4,
                  placeholder: 'Enter your message here...',
                }}
              />
            </div>
          </>
        )}
      </div>
    );
  },
);

SlackPopupContent.displayName = 'SlackPopupContent';

export default SlackPopupContent;
