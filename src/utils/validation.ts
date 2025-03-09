/**
 * Validate a Slack webhook URL
 */
export const isValidSlackWebhookUrl = (url: string): boolean => {
  // If no URL is provided, it's technically valid (though not useful)
  if (!url) return true;

  // Basic validation for Slack webhook URL format
  return url.startsWith('https://hooks.slack.com/services/');
};

/**
 * Validate a GitHub host
 */
export const isValidGitHubHost = (host: string): boolean => {
  // If no host is provided, use default (github.com)
  if (!host) return true;

  // Simple regex for hostname validation
  const hostnameRegex =
    /^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9-]*[A-Za-z0-9])$/;
  return hostnameRegex.test(host);
};

/**
 * Clean hostname (remove protocol, trailing slashes, etc.)
 */
export const cleanHostname = (host: string): string => {
  // Remove protocol
  let cleanHost = host.replace(/^https?:\/\//, '');

  // Remove trailing slashes
  cleanHost = cleanHost.replace(/\/+$/, '');

  return cleanHost;
};
