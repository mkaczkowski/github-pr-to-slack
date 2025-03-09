/**
 * Validation utility functions for the GitHub PR to Slack extension
 */

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
 * Clean a hostname by removing protocol and trailing slash
 */
export const cleanHostname = (hostname: string): string => {
  if (!hostname) return '';

  let cleanHost = hostname.trim();

  // Remove protocol prefix
  if (cleanHost.startsWith('http://')) {
    cleanHost = cleanHost.substring(7);
  } else if (cleanHost.startsWith('https://')) {
    cleanHost = cleanHost.substring(8);
  }

  // Remove trailing slash
  if (cleanHost.endsWith('/')) {
    cleanHost = cleanHost.slice(0, -1);
  }

  return cleanHost;
};
