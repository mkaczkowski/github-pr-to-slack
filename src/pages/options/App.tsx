import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import FormField from '../../components/FormField/FormField';
import StatusMessage from '../../components/StatusMessage/StatusMessage';
import { getGitHubHost, getSlackWebhookUrl, saveGitHubHost, saveSlackWebhookUrl } from '../../utils/storage';
import { cleanHostname, isValidGitHubHost, isValidSlackWebhookUrl } from '../../utils/validation';
import { debug } from '../../utils/chrome-polyfill';
import logo from '../../assets/logo48.png';

// Define the form schema using Zod
const formSchema = z.object({
  githubHost: z.string().refine((val) => !val || isValidGitHubHost(val), {
    message: 'Please enter a valid hostname (e.g. github.company.com)',
  }),
  slackWebhookUrl: z
    .string()
    .refine((val) => isValidSlackWebhookUrl(val), { message: 'Please enter a valid Slack webhook URL' }),
});

// Define the form data type from the schema
type FormData = z.infer<typeof formSchema>;

interface FormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

/**
 * FormSection component for standardized form sections
 */
export const FormSection: React.FC<FormSectionProps> = React.memo(({ title, description, children }) => {
  return (
    <section className="option-section">
      <h2>{title}</h2>
      {description && <p className="section-description">{description}</p>}
      {children}
    </section>
  );
});

FormSection.displayName = 'FormSection';

/**
 * App component for the options page
 */
export const App: React.FC = React.memo(() => {
  // Status message state
  const [statusMessage, setStatusMessage] = React.useState('');
  const [statusType, setStatusType] = React.useState<'success' | 'error' | 'warning' | ''>('');

  // React Hook Form setup
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isDirty },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      githubHost: '',
      slackWebhookUrl: '',
    },
    mode: 'onChange',
  });

  const [isLoading, setIsLoading] = React.useState(true);

  // Clear status message
  const clearStatusMessage = (): void => {
    setStatusMessage('');
    setStatusType('');
  };

  // Load settings from storage
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true);

        // Load GitHub host
        const storedGitHubHost = await getGitHubHost();

        // Load Slack webhook URL
        const storedSlackWebhookUrl = await getSlackWebhookUrl();

        // Update form values
        setValue('githubHost', storedGitHubHost || '', { shouldDirty: false });
        setValue('slackWebhookUrl', storedSlackWebhookUrl || '', { shouldDirty: false });

        // Reset form state
        reset({ githubHost: storedGitHubHost || '', slackWebhookUrl: storedSlackWebhookUrl || '' });

        clearStatusMessage();
      } catch (error) {
        debug.error('Options', 'Error loading settings', error);
        setStatusMessage(`Error loading settings: ${(error as Error).message}`);
        setStatusType('error');
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [setValue, reset]);

  // Handle form submission
  const onSubmit = React.useCallback(
    async (data: FormData) => {
      try {
        setIsLoading(true);
        clearStatusMessage();

        const cleanedHost = data.githubHost ? cleanHostname(data.githubHost) : '';

        // Save settings
        await saveGitHubHost(cleanedHost);
        await saveSlackWebhookUrl(data.slackWebhookUrl);

        // Show success message
        setStatusMessage('Settings saved successfully');
        setStatusType('success');

        // Reset form state
        reset(data);
      } catch (error) {
        debug.error('Options', 'Error saving settings', error);
        setStatusMessage(`Error saving settings: ${(error as Error).message || 'Unknown error'}`);
        setStatusType('error');
      } finally {
        setIsLoading(false);
      }
    },
    [reset, clearStatusMessage],
  );

  // Auto-save when form values change
  useEffect(() => {
    if (isDirty) {
      const timer = setTimeout(() => {
        handleSubmit(onSubmit)();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [isDirty, handleSubmit, onSubmit]);

  return (
    <div className="options-container">
      <header className="options-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img
            src={logo}
            alt="Logo"
            width="28"
            height="30"
            style={{ borderRadius: '50%', position: 'relative', top: '-1px' }}
          />
          <h1 style={{ fontSize: '1.4rem' }}>Send PR to Slack Settings</h1>
        </div>
      </header>

      <main className="options-main">
        <div style={{ margin: '20px 26px 0px 26px' }}>
          {statusMessage && <StatusMessage message={statusMessage} type={statusType} />}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="options-form">
          <FormSection
            title="GitHub Configuration"
            description="Configure GitHub host settings. Leave empty for github.com (default)."
          >
            <FormField
              id="github-host"
              label="GitHub Host (optional)"
              {...register('githubHost', {
                onChange: (e) => {
                  const value = e.target.value;
                  const cleanedValue = cleanHostname(value);
                  if (value !== cleanedValue) {
                    setValue('githubHost', cleanedValue, { shouldValidate: true, shouldDirty: true });
                  }
                },
              })}
              error={errors.githubHost?.message}
              inputProps={{
                placeholder: 'e.g. github.mycompany.com',
                disabled: isLoading,
              }}
            />
          </FormSection>

          <FormSection
            title="Slack Configuration"
            description="Generate a webhook URL from your Slack workspace's App settings page."
          >
            <FormField
              id="slack-webhook"
              label="Slack Webhook URL"
              {...register('slackWebhookUrl')}
              error={errors.slackWebhookUrl?.message}
              inputProps={{
                placeholder: 'https://hooks.slack.com/services/...',
                disabled: isLoading,
              }}
            />
          </FormSection>
        </form>
      </main>

      <footer className="options-footer">
        <p>Send PR to Slack &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
});

App.displayName = 'App';

export default App;
