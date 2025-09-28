import { describe, it, expect } from 'vitest';
import { formatPRPreviewMessage, wrapSlackMentions, getPRFormattingData, PRInfo } from './pr';

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
