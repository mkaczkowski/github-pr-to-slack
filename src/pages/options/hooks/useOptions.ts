import { useEffect, useState, useRef } from 'react';
import { debug } from '../../../utils/chrome-polyfill';
import { getGitHubHost, getSlackWebhookUrl, saveGitHubHost, saveSlackWebhookUrl } from '../../../utils/storage';
import { cleanHostname, isValidGitHubHost, isValidSlackWebhookUrl } from '../../../utils/validation';

interface FormData {
  githubHost: string;
  slackWebhookUrl: string;
  isLoading: boolean;
  errors: Record<string, string>;
}

interface StatusState {
  message: string;
  type: 'success' | 'error' | 'warning' | '';
}

export const useOptions = () => {
  const [formData, setFormData] = useState<FormData>({
    githubHost: '',
    slackWebhookUrl: '',
    isLoading: true,
    errors: {},
  });

  const [status, setStatus] = useState<StatusState>({
    message: '',
    type: '',
  });

  const { githubHost, slackWebhookUrl, isLoading, errors } = formData;
  const { message: statusMessage, type: statusType } = status;

  // Add debounce timer ref
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const clearStatusMessage = (): void => {
    setStatus({
      message: '',
      type: '',
    });
  };

  const setFormField = (field: string, value: string): void => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const setError = (field: string, errorMessage: string): void => {
    setFormData((prev) => ({
      ...prev,
      errors: {
        ...prev.errors,
        [field]: errorMessage,
      },
    }));
  };

  const clearError = (field: string): void => {
    setFormData((prev) => {
      const newErrors = { ...prev.errors };
      delete newErrors[field];
      return {
        ...prev,
        errors: newErrors,
      };
    });
  };

  const loadSettings = () => {
    try {
      setFormData((prev) => ({ ...prev, isLoading: true }));

      // Handle the Promise returned by getGitHubHost
      getGitHubHost()
        .then((storedGitHubHost) => {
          // Handle the Promise returned by getSlackWebhookUrl
          getSlackWebhookUrl()
            .then((storedSlackWebhookUrl) => {
              setFormData({
                githubHost: storedGitHubHost || '',
                slackWebhookUrl: storedSlackWebhookUrl || '',
                isLoading: false,
                errors: {},
              });

              setStatus({
                message: '',
                type: '',
              });
            })
            .catch((error) => {
              debug.error('Options', 'Error loading Slack webhook URL', error);
              setFormData((prev) => ({
                ...prev,
                slackWebhookUrl: '',
                isLoading: false,
              }));
            });
        })
        .catch((error) => {
          debug.error('Options', 'Error loading GitHub host', error);
          setFormData((prev) => ({
            ...prev,
            githubHost: '',
            isLoading: false,
          }));
        });
    } catch (error) {
      debug.error('Options', 'Error loading settings', error);
      setFormData((prev) => ({ ...prev, isLoading: false }));
      setStatus({
        message: `Error loading settings: ${(error as Error).message}`,
        type: 'error',
      });
    }
  };

  const saveSettings = async (): Promise<boolean> => {
    try {
      setFormData((prev) => ({
        ...prev,
        isLoading: true,
      }));

      setFormData((prev) => ({
        ...prev,
        errors: {},
      }));

      let validGitHubHost = true;
      if (githubHost) {
        validGitHubHost = isValidGitHubHost(githubHost);
        if (!validGitHubHost) {
          setError('githubHost', 'Please enter a valid hostname (e.g. github.company.com)');
        }
      }

      const validWebhook = isValidSlackWebhookUrl(slackWebhookUrl);
      if (!slackWebhookUrl) {
        setError('webhook', 'Slack webhook URL is required');
      } else if (!validWebhook) {
        setError('webhook', 'Please enter a valid Slack webhook URL');
      }

      if (!validGitHubHost || !validWebhook) {
        setFormData((prev) => ({
          ...prev,
          isLoading: false,
        }));
        return false;
      }

      const cleanedHost = githubHost ? cleanHostname(githubHost) : '';

      try {
        await saveGitHubHost(cleanedHost);
        await saveSlackWebhookUrl(slackWebhookUrl);
      } catch (error) {
        debug.error('Options', 'Error saving settings', error);
        setStatus({
          message: `Error saving settings: ${(error as Error).message || 'Unknown error'}`,
          type: 'error',
        });
        setFormData((prev) => ({
          ...prev,
          isLoading: false,
        }));
        return false;
      }

      setStatus({
        message: '',
        type: '',
      });

      return true;
    } catch (error) {
      debug.error('Options', 'Error saving settings', error);
      setStatus({
        message: `Error saving settings: ${(error as Error).message}`,
        type: 'error',
      });
      return false;
    } finally {
      setFormData((prev) => ({
        ...prev,
        isLoading: false,
      }));
    }
  };

  const handleGithubHostChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    const value = e.target.value;
    setFormField('githubHost', value);

    if (errors.githubHost) {
      clearError('githubHost');
    }

    // Auto-save after input change with debounce
    saveSettings();
  };

  const handleSlackWebhookChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    const value = e.target.value;
    setFormField('slackWebhookUrl', value);

    if (errors.webhook) {
      clearError('webhook');
    }

    // Auto-save after input change with debounce
    saveSettings();
  };

  useEffect(() => {
    loadSettings();

    // Cleanup timer on unmount
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  return {
    githubHost,
    slackWebhookUrl,
    isLoading,
    statusMessage,
    statusType,
    errors,
    clearStatusMessage,
    saveSettings,
    handleGithubHostChange,
    handleSlackWebhookChange,
  };
};
