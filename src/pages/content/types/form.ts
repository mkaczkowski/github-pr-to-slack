import { z } from 'zod';

// Form schema for Slack message form
export const slackFormSchema = z.object({
  channel: z.string().min(1, 'Please enter a channel name'),
  message: z.string().min(1, 'Please enter a message'),
});

// Type for the form values
export type SlackFormValues = z.infer<typeof slackFormSchema>;

// Default values for the form
export const defaultSlackFormValues: SlackFormValues = {
  channel: '',
  message: '',
};
