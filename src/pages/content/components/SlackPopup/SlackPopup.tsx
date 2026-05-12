import { zodResolver } from '@hookform/resolvers/zod';
import React, { useEffect, useRef, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { debug } from '../../../../utils/chrome-polyfill';
import { SlackWebhook } from '../../../../types/webhook';
import { useGithubPR } from '../../hooks/useGithubPR';
import { useSlack } from '../../hooks/useSlack';
import { useUIHelpers } from '../../hooks/useUIHelpers';
import { SlackFormValues, slackFormSchema } from '../../types/form';
import SlackPopupContent from '../SlackPopupContent/SlackPopupContent';
import SlackPopupFooter from '../SlackPopupFooter/SlackPopupFooter';
import SlackPopupHeader from '../SlackPopupHeader/SlackPopupHeader';
import styles from './SlackPopup.module.css';

interface SlackPopupProps {
  onClose: () => void;
}

/**
 * SlackPopup component for sending PR info to Slack
 */
export const SlackPopup: React.FC<SlackPopupProps> = React.memo(({ onClose }) => {
  // Custom hooks
  const {
    isConfigured,
    statusMessage,
    setStatusMessage,
    checkSlackConfig,
    loadWebhooks,
    loadLastUsedWebhookName,
    sendToSlack,
  } = useSlack();

  const { prInfo, generatePreviewMessage } = useGithubPR();

  const { popupRef, copyToClipboard, openOptions, handleKeyDown } = useUIHelpers(onClose);

  const [webhooks, setWebhooks] = useState<SlackWebhook[]>([]);

  // React Hook Form setup
  const methods = useForm<SlackFormValues>({
    resolver: zodResolver(slackFormSchema),
    defaultValues: {
      webhookName: '',
      message: '',
    },
    mode: 'onChange', // Validate on change
  });

  const { handleSubmit, setValue, trigger } = methods;

  // Refs for input elements
  const initialMountRef = useRef<boolean>(true);
  const initializedRef = useRef<boolean>(false);
  const slackButtonRef = useRef<HTMLButtonElement>(null);

  // Initialize the popup
  useEffect(() => {
    let isMounted = true;
    const init = async (): Promise<void> => {
      // Prevent multiple initializations
      if (initializedRef.current) return;
      initializedRef.current = true;

      try {
        // Check if Slack is configured
        await checkSlackConfig();

        if (!isMounted) return;

        const [loadedWebhooks, lastUsedName] = await Promise.all([loadWebhooks(), loadLastUsedWebhookName()]);
        if (!isMounted) return;

        setWebhooks(loadedWebhooks);

        if (loadedWebhooks.length > 0) {
          const preselected = loadedWebhooks.find((hook) => hook.name === lastUsedName)?.name ?? loadedWebhooks[0].name;
          setValue('webhookName', preselected, { shouldValidate: true });
        }

        // Set the default message
        const defaultMessage = generatePreviewMessage();
        debug.log('SlackPopup', 'Default message:', defaultMessage);
        if (defaultMessage && isMounted) {
          setValue('message', defaultMessage);
          // Validate the message field
          trigger('message');
        }
      } catch (error) {
        console.error('Error initializing popup:', error);
      }
    };

    init();

    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  }, [checkSlackConfig, loadWebhooks, loadLastUsedWebhookName, setValue, trigger, generatePreviewMessage]);

  // Focus the SlackButton when the popup is opened and configured
  useEffect(() => {
    if (isConfigured && slackButtonRef.current && initializedRef.current) {
      // Use setTimeout to ensure the button is rendered and accessible
      setTimeout(() => {
        slackButtonRef.current?.focus();
      }, 100);
    }
  }, [isConfigured]);

  /**
   * Handle send to Slack
   */
  const onSubmit = async (data: SlackFormValues): Promise<void> => {
    // Clear previous status
    setStatusMessage({ text: '', type: '' });

    // Check if PR info is available
    if (!prInfo) {
      setStatusMessage({
        text: 'Unable to get PR information. Please try again.',
        type: 'error',
      });
      return;
    }

    try {
      const result = await sendToSlack({
        webhookName: data.webhookName,
        message: data.message,
      });

      if (result.success) {
        setStatusMessage({
          text: 'Message sent to Slack',
          type: 'success',
        });
      } else {
        setStatusMessage({
          text: result.error || 'Failed to send message to Slack',
          type: 'error',
        });
      }
    } catch (error) {
      setStatusMessage({
        text: 'An error occurred while sending the message.',
        type: 'error',
      });
    }
  };

  /**
   * Handle copy to clipboard
   */
  const handleCopyToClipboard = async (): Promise<void> => {
    // Get current message value from form
    const currentMessage = methods.getValues('message');

    // Check if message is empty without triggering validation
    if (!currentMessage || currentMessage.trim() === '') {
      setStatusMessage({
        text: 'No message to copy. Please enter a message first.',
        type: 'warning',
      });
      return;
    }

    const success = await copyToClipboard(currentMessage);

    if (success) {
      setStatusMessage({
        text: 'Message copied to clipboard',
        type: 'success',
      });
    } else {
      setStatusMessage({
        text: 'Failed to copy message. Please try again.',
        type: 'error',
      });
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.popup} ref={popupRef} onKeyDown={(e) => handleKeyDown(e, handleSubmit(onSubmit), onClose)}>
        <SlackPopupHeader onClose={onClose} />

        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <SlackPopupContent
              statusMessage={statusMessage}
              setStatusMessage={setStatusMessage}
              isConfigured={isConfigured}
              openOptions={openOptions}
              webhooks={webhooks}
            />

            <SlackPopupFooter
              handleCopyToClipboard={handleCopyToClipboard}
              handleSendToSlack={handleSubmit(onSubmit)}
              isSending={methods.formState.isSubmitting}
              isConfigured={isConfigured}
              slackButtonRef={slackButtonRef as unknown as React.RefObject<HTMLButtonElement>}
            />
          </form>
        </FormProvider>
      </div>
    </div>
  );
});

SlackPopup.displayName = 'SlackPopup';

export default SlackPopup;
