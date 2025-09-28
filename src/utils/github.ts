// Define the PR information interface
import { debug } from './chrome-polyfill';
import { getGitHubHost } from './storage';
import { PRInfo } from './pr';

/**
 * Check if the given URL is a supported site (GitHub PR page)
 * Note: This only checks the URL pattern. The actual PR status check (open/closed/merged)
 * happens in the content script using isPROpen() when the page is loaded.
 */
export const isSupportedUrl = async (url: string | undefined): Promise<boolean> => {
  if (!url) return false;

  // Get the hostname from the URL
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;

    // Get configured GitHub host from storage
    const configuredHost = await getGitHubHost();

    // Check if it's a GitHub URL (either the configured host or github.com) and contains a PR path
    const isGitHub = configuredHost ? hostname === configuredHost : hostname === 'github.com';

    return isGitHub && url.includes('/pull/');
  } catch (error) {
    debug.error('GitHub', 'Error parsing URL', error);
    return false;
  }
};

/**
 * Check if the current page is a GitHub PR page
 */
export const isOnPRPage = (): boolean => {
  const pathname = window.location.pathname;
  const isPullRequest = pathname.includes('/pull/');

  // Additional checks to ensure we're on a PR page
  const hasPRElements = !!(
    document.querySelector('.gh-header-title') ||
    document.querySelector('.js-issue-title') ||
    document.querySelector('#partial-discussion-header')
  );

  debug.log('GitHub', 'isOnPRPage check:', {
    pathname,
    isPullRequest,
    hasPRElements,
    result: isPullRequest && hasPRElements,
  });

  // Only return true if both the URL pattern matches and we find PR elements on the page
  return isPullRequest && hasPRElements;
};

/**
 * Check if the current PR is in 'open' status
 */
export const isPROpen = (): boolean => {
  try {
    // GitHub uses a state label with specific classes to indicate PR status
    const stateLabel = document.querySelector('.State');

    if (!stateLabel) {
      debug.log('GitHub', 'PR state label not found');
      return false;
    }

    // Check if the state label contains the 'open' class or text
    const isOpen =
      stateLabel.classList.contains('State--open') || stateLabel.textContent?.toLowerCase().includes('open');

    debug.log('GitHub', 'PR open status check:', { isOpen });

    return !!isOpen;
  } catch (error) {
    debug.error('GitHub', 'Error checking PR status', error);
    return false;
  }
};

/**
 * Check if the current page is a GitHub PR page in 'open' status
 */
export const isOpenPRPage = (): boolean => {
  return isOnPRPage() && isPROpen();
};

/**
 * Check if we're on a configured GitHub host
 */
export const isGitHubHost = (configuredHost: string): boolean => {
  const currentHost = window.location.hostname;
  return configuredHost ? currentHost === configuredHost : currentHost === 'github.com';
};

/**
 * Extract PR information from the current page
 */
export const extractPRInfo = (): PRInfo => {
  try {
    // Get PR title
    const prTitle =
      document.querySelector('.js-issue-title')?.textContent?.trim() ||
      document.querySelector('.gh-header-title')?.textContent?.trim() ||
      'Unknown PR Title';

    // Get PR URL
    const prUrl = window.location.href;

    // Get PR reviewers
    const reviewers = Array.from(
      document.querySelectorAll(".js-issue-sidebar-form[aria-label='Select reviewers'] .avatar-user"),
    )?.map((reviewer) => {
      return (
        (reviewer as HTMLElement).getAttribute('alt') ||
        (reviewer as HTMLElement).getAttribute('aria-label') ||
        'Unknown Reviewer'
      );
    });

    const authorElement =
      (document.querySelector('.timeline-comment-header-text .author') as HTMLElement | null) ||
      (document.querySelector('a.author') as HTMLElement | null) ||
      (document.querySelector('span.author') as HTMLElement | null);

    const authorText = authorElement?.textContent?.trim();
    const author = authorText ? authorText.replace(/^@/, '') : undefined;

    const loc =
      document
        .querySelector('.diffstat')
        ?.textContent?.split('\n')
        ?.map((val) => val.trim())
        ?.filter(Boolean) || [];

    return {
      title: prTitle,
      url: prUrl,
      loc,
      reviewers,
      author,
    };
  } catch (error) {
    debug.error('GitHub', 'Error extracting PR info', error);

    // Return minimal information if extraction fails
    return {
      title: document.title || 'GitHub PR',
      url: window.location.href,
      author: 'Unknown',
      number: window.location.pathname.split('/').pop() || 'Unknown',
      repo: window.location.pathname.split('/').slice(1, 3).join('/') || 'Unknown Repo',
    };
  }
};
