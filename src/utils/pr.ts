export interface PRInfo {
  title: string;
  url: string;
  reviewers?: string[];
  loc?: string[];
  author?: string;
  number?: string;
  repo?: string;
}

export const sanitizeSlackUserId = (name: string): string => name.replace(/[.@]/g, '').replace(/[^a-zA-Z0-9_-]/g, '');

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
