import { describe, it, expect } from 'vitest';
import {
  extractGitHubUsername,
  formatPRPreviewMessage,
  wrapSlackMentions,
  getPRFormattingData,
  sanitizeSlackUserId,
  PRInfo,
} from './pr';

describe('PR Utilities', () => {
  const baseInfo: PRInfo = {
    title: 'Test PR Title',
    url: 'https://github.com/user/repo/pull/123',
  };

  describe('formatPRPreviewMessage', () => {
    it('formats preview with LOC and reviewers', () => {
      const preview = formatPRPreviewMessage({
        ...baseInfo,
        loc: ['+100', '-50'],
        reviewers: ['user.one', 'user_two'],
      });

      expect(preview).toBe('*Test PR Title* (+100, -50)\nhttps://github.com/user/repo/pull/123\nassigned: @userone, @user_two');
    });

    it('includes sanitized author when provided', () => {
      const preview = formatPRPreviewMessage({
        ...baseInfo,
        author: 'author.name',
      });

      expect(preview).toBe('*Test PR Title*\nhttps://github.com/user/repo/pull/123\nauthor: @authorname');
    });

    it('formats author and reviewers from GitHub display-name text', () => {
      const preview = formatPRPreviewMessage({
        ...baseInfo,
        loc: ['+272', '−2'],
        author: 'Casey Author (cauthor)',
        reviewers: ['Riley Chen (rchen)', 'Quinn Patel (qpatel)'],
      });

      expect(preview).toBe(
        '*Test PR Title* (+272, −2)\nhttps://github.com/user/repo/pull/123\nauthor: @cauthor\nassigned: @rchen, @qpatel',
      );
    });
  });

  describe('extractGitHubUsername', () => {
    it('returns a plain username unchanged', () => {
      expect(extractGitHubUsername('rchen')).toBe('rchen');
      expect(extractGitHubUsername('@cauthor')).toBe('cauthor');
    });

    it('extracts the handle from "Display Name (username)"', () => {
      expect(extractGitHubUsername('Riley Chen (rchen)')).toBe('rchen');
      expect(extractGitHubUsername('Casey Author (@cauthor)')).toBe('cauthor');
      expect(extractGitHubUsername('Quinn Patel (qpatel)')).toBe('qpatel');
    });

    it('collapses whitespace before parsing', () => {
      expect(extractGitHubUsername('  Riley   Chen\n(rchen)  ')).toBe('rchen');
    });
  });

  describe('getPRFormattingData', () => {
    it('sanitizes reviewers and author', () => {
      const data = getPRFormattingData({
        ...baseInfo,
        reviewers: ['user.name', 'user@email.com'],
        author: 'author.name',
      });

      expect(data.sanitizedReviewers).toEqual(['username', 'useremailcom']);
      expect(data.sanitizedAuthor).toBe('authorname');
    });

    it('uses the GitHub username, not the display name', () => {
      const data = getPRFormattingData({
        ...baseInfo,
        author: 'Casey Author (cauthor)',
        reviewers: ['Riley Chen (rchen)', 'Quinn Patel (qpatel)'],
      });

      expect(data.sanitizedAuthor).toBe('cauthor');
      expect(data.sanitizedReviewers).toEqual(['rchen', 'qpatel']);
      expect(sanitizeSlackUserId('Riley Chen (rchen)')).toBe('rchen');
    });
  });

  describe('wrapSlackMentions', () => {
    it('wraps mentions with sanitized handles', () => {
      const message = 'Please review @user.name and @user_two!';
      expect(wrapSlackMentions(message)).toBe('Please review <@username> and <@user_two>!');
    });

    it('leaves handles without alphanumeric characters untouched', () => {
      const message = 'Ping @??? to check';
      expect(wrapSlackMentions(message)).toBe('Ping @??? to check');
    });
  });
});
