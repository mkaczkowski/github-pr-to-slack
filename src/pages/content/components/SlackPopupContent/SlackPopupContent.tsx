import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Button } from '../../../../components/Button/Button';
import StatusMessage from '../../../../components/StatusMessage/StatusMessage';
import TextArea from '../../../../components/TextArea/TextArea';
import { SlackFormValues } from '../../types/form';
import { SlackWebhook } from '../../../../types/webhook';
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
  webhooks: SlackWebhook[];
}

/**
 * SlackPopupContent component for the content section of SlackPopup
 */
export const SlackPopupContent: React.FC<SlackPopupContentProps> = React.memo(
  ({ statusMessage, isConfigured, openOptions, webhooks }) => {
    const {
      register,
      formState: { errors },
    } = useFormContext<SlackFormValues>();

    const hasWebhooks = webhooks.length > 0;

    return (
      <div className={styles.content}>
        {statusMessage.text && (
          <StatusMessage
            message={statusMessage.text}
            type={statusMessage.type as 'success' | 'error' | 'warning' | ''}
          />
        )}

        {(!isConfigured || !hasWebhooks) && (
          <div className={styles.formGroup}>
            <p>
              You need to add at least one Slack webhook before you can send messages.{' '}
              <Button variant="secondary" onClick={openOptions}>
                Open Options
              </Button>
            </p>
          </div>
        )}

        {isConfigured && hasWebhooks && (
          <>
            <div className={styles.formGroup}>
              <label htmlFor="webhook-name">Webhook</label>
              <select
                id="webhook-name"
                className={styles.select}
                {...register('webhookName')}
                aria-invalid={errors.webhookName ? 'true' : 'false'}
              >
                {webhooks.map((hook) => (
                  <option key={hook.name} value={hook.name}>
                    {hook.name}
                  </option>
                ))}
              </select>
              {errors.webhookName?.message && <div className={styles.errorMessage}>{errors.webhookName.message}</div>}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="message">Message</label>
              <TextArea
                id="message"
                {...register('message')}
                error={errors.message?.message}
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
