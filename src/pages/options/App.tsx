import React, { useEffect } from 'react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import FormField from '../../components/FormField/FormField';
import StatusMessage from '../../components/StatusMessage/StatusMessage';
import { Button } from '../../components/Button/Button';
import { getGitHubHost, getSlackWebhooks, saveGitHubHost, saveSlackWebhooks } from '../../utils/storage';
import { cleanHostname, isValidGitHubHost, isValidSlackWebhookUrl } from '../../utils/validation';
import { debug } from '../../utils/chrome-polyfill';
import logo from '../../assets/logo48.png';

const webhookSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  url: z.string().refine((val) => isValidSlackWebhookUrl(val), {
    message: 'Please enter a valid Slack webhook URL',
  }),
});

const formSchema = z
  .object({
    githubHost: z.string().refine((val) => !val || isValidGitHubHost(val), {
      message: 'Please enter a valid hostname (e.g. github.company.com)',
    }),
    webhooks: z.array(webhookSchema).min(1, 'Add at least one Slack webhook'),
  })
  .superRefine((data, ctx) => {
    const seen = new Set<string>();
    data.webhooks.forEach((hook, index) => {
      const key = hook.name.trim().toLowerCase();
      if (!key) return;
      if (seen.has(key)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['webhooks', index, 'name'],
          message: 'Webhook names must be unique',
        });
      }
      seen.add(key);
    });
  });

type FormData = z.infer<typeof formSchema>;

interface FormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

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

const EMPTY_WEBHOOK = { name: '', url: '' };

export const App: React.FC = React.memo(() => {
  const [statusMessage, setStatusMessage] = React.useState('');
  const [statusType, setStatusType] = React.useState<'success' | 'error' | 'warning' | ''>('');

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors, isDirty },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      githubHost: '',
      webhooks: [EMPTY_WEBHOOK],
    },
    mode: 'onChange',
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'webhooks',
  });

  const [isLoading, setIsLoading] = React.useState(true);

  const clearStatusMessage = (): void => {
    setStatusMessage('');
    setStatusType('');
  };

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true);

        const storedGitHubHost = await getGitHubHost();
        const storedWebhooks = await getSlackWebhooks();

        const initialWebhooks = storedWebhooks.length > 0 ? storedWebhooks : [EMPTY_WEBHOOK];

        reset({
          githubHost: storedGitHubHost || '',
          webhooks: initialWebhooks,
        });

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

  const onSubmit = React.useCallback(
    async (data: FormData) => {
      try {
        setIsLoading(true);
        clearStatusMessage();

        const cleanedHost = data.githubHost ? cleanHostname(data.githubHost) : '';

        await saveGitHubHost(cleanedHost);
        await saveSlackWebhooks(data.webhooks);

        setStatusMessage('Settings saved successfully');
        setStatusType('success');

        reset({ githubHost: cleanedHost, webhooks: data.webhooks });
      } catch (error) {
        debug.error('Options', 'Error saving settings', error);
        setStatusMessage(`Error saving settings: ${(error as Error).message || 'Unknown error'}`);
        setStatusType('error');
      } finally {
        setIsLoading(false);
      }
    },
    [reset],
  );

  const watchedValues = useWatch({ control });

  useEffect(() => {
    if (!isDirty) return;

    const timer = setTimeout(() => {
      handleSubmit(onSubmit)();
    }, 500);

    return () => clearTimeout(timer);
  }, [watchedValues, isDirty, handleSubmit, onSubmit]);

  const webhooksError = errors.webhooks && !Array.isArray(errors.webhooks) ? errors.webhooks.message : undefined;

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
            title="Slack Webhooks"
            description="Each webhook posts to the channel it was created for in Slack. Add one entry per destination."
          >
            {fields.map((field, index) => (
              <div key={field.id} className="webhook-row">
                <FormField
                  id={`webhook-name-${index}`}
                  label={index === 0 ? 'Name' : undefined}
                  {...register(`webhooks.${index}.name` as const)}
                  error={errors.webhooks?.[index]?.name?.message}
                  inputProps={{
                    placeholder: 'e.g. #frontend',
                    disabled: isLoading,
                  }}
                />
                <FormField
                  id={`webhook-url-${index}`}
                  label={index === 0 ? 'Webhook URL' : undefined}
                  {...register(`webhooks.${index}.url` as const)}
                  error={errors.webhooks?.[index]?.url?.message}
                  inputProps={{
                    placeholder: 'https://hooks.slack.com/services/...',
                    disabled: isLoading,
                  }}
                />
                <Button
                  variant="secondary"
                  onClick={() => remove(index)}
                  disabled={isLoading || fields.length === 1}
                  aria-label={`Remove webhook ${index + 1}`}
                >
                  Remove
                </Button>
              </div>
            ))}

            {webhooksError && <div className="error-message">{webhooksError}</div>}

            <div style={{ marginTop: '12px' }}>
              <Button variant="secondary" onClick={() => append(EMPTY_WEBHOOK)} disabled={isLoading}>
                Add webhook
              </Button>
            </div>
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
