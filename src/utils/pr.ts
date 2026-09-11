export interface PRInfo {
  title: string;
  url: string;
  reviewers?: string[];
  loc?: string[];
  author?: string;
  number?: string;
  repo?: string;
}

/**
 * GitHub sidebar/author text is now often "Display Name (username)".
 * Prefer the parenthetical handle so Slack mentions stay usernames.
 */
export const extractGitHubUsername = (raw: string): string => {
  const normalized = raw.replace(/\s+/g, ' ').trim().replace(/^@/, '');
  if (!normalized) return '';

  const parenthetical = normalized.match(/\(([^)]+)\)\s*$/);
  if (parenthetical) {
    const handle = parenthetical[1].trim().replace(/^@/, '');
    if (handle) return handle;
  }

  return normalized;
};

export const sanitizeSlackUserId = (name: string): string =>
  extractGitHubUsername(name).replace(/[.@]/g, '').replace(/[^a-zA-Z0-9_-]/g, '');

export const formatLocText = (loc: string[] = []): string => (loc.length > 0 ? ` (${loc.join(', ')})` : '');

interface PRFormattingData {
  locText: string;
  sanitizedReviewers: string[];
  sanitizedAuthor?: string;
}

export const getPRFormattingData = (prInfo: PRInfo): PRFormattingData => {
  const { loc = [], reviewers = [], author } = prInfo;

  return {
    locText: formatLocText(loc),
    sanitizedReviewers: reviewers.map((reviewer) => sanitizeSlackUserId(reviewer)),
    sanitizedAuthor: author ? sanitizeSlackUserId(author) : undefined,
  };
};

export const formatPRPreviewMessage = (prInfo: PRInfo): string => {
  const { title, url } = prInfo;
  const { locText, sanitizedReviewers, sanitizedAuthor } = getPRFormattingData(prInfo);

  const lines = [`*${title}*${locText}`, url];

  if (sanitizedAuthor) {
    lines.push(`author: @${sanitizedAuthor}`);
  }

  if (sanitizedReviewers.length > 0) {
    lines.push(`assigned: ${sanitizedReviewers.map((reviewer) => `@${reviewer}`).join(', ')}`);
  }

  return lines.join('\n');
};

export const wrapSlackMentions = (message: string): string =>
  message.replace(/@([a-zA-Z0-9_.-]+)/g, (_, handle: string) => {
    const sanitized = sanitizeSlackUserId(handle);
    return sanitized ? `<@${sanitized}>` : `@${handle}`;
  });
