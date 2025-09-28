// Define status message structure
interface StatusMessage {
  text: string;
  type: string;
}

// Define form error structure
interface FormErrors {
  [key: string]: string;
}

// Define form data structure for options
interface OptionsFormData {
  githubHost: string;
  slackWebhookUrl: string;
  isLoading: boolean;
  errors: FormErrors;
}

// Define status state structure
interface StatusState {
  message: string;
  type: string;
}

// Define slack popup state structure
interface SlackPopupState {
  message: string;
  isSending: boolean;
}
