import { useState, useCallback } from 'react';
import { extractPRInfo } from '../../../utils/github';
import { debug } from '../../../utils/chrome-polyfill';

interface PRInfo {
  title: string;
  url: string;
  reviewers?: string[];
  loc?: string[];
  author?: string;
  number?: string;
  repo?: string;
}

export const useGithubPR = () => {
  const [prInfo] = useState<PRInfo | null>(() => {
    try {
      return extractPRInfo();
    } catch (error) {
      debug.log('useGithubPR', 'Error extracting PR info:', error);
      return null;
    }
  });

  // Use useCallback to memoize the function and prevent unnecessary re-renders
  const generatePreviewMessage = useCallback((): string => {
    if (!prInfo) {
      // Return a default message if PR info is not available
      return 'Please enter your message here...';
    }

    const { title, url, reviewers = [], loc = [] } = prInfo;

    let preview = `*${title}*`;

    if (loc.length > 0) {
      preview += ` (${loc.join(', ')})`;
    }

    preview += `\n${url}`;

    if (reviewers.length > 0) {
      preview += `\nassigned: ${reviewers.map((reviewer) => `@${reviewer.replace(/[^a-zA-Z0-9_-]/g, '')}`).join(', ')}`;
    }

    return preview || 'Please enter your message here...'; // Fallback if preview is empty
  }, [prInfo]); // Only depend on prInfo

  return {
    prInfo,
    generatePreviewMessage,
  };
};
