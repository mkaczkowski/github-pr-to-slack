import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { isSupportedUrl, isOnPRPage, extractPRInfo } from './github';
import { getGitHubHost } from './storage';
import { chromeMock } from '../test/mocks/chrome';

// Mock the storage module
vi.mock('./storage', () => ({
  getGitHubHost: vi.fn(),
}));

// Mock the chrome-polyfill module
vi.mock('./chrome-polyfill', () => ({
  debug: {
    log: vi.fn(),
    error: vi.fn(),
  },
}));

describe('GitHub Utilities', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Default mock for getGitHubHost
    (getGitHubHost as any).mockResolvedValue('');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('isSupportedUrl', () => {
    it('should return false for undefined URL', async () => {
      const result = await isSupportedUrl(undefined);
      expect(result).toBe(false);
    });

    it('should return false for non-GitHub URLs', async () => {
      const result = await isSupportedUrl('https://example.com/some/path');
      expect(result).toBe(false);
    });

    it('should return false for GitHub URLs without PR path', async () => {
      const result = await isSupportedUrl('https://github.com/user/repo');
      expect(result).toBe(false);
    });

    it('should return true for GitHub PR URLs', async () => {
      const result = await isSupportedUrl('https://github.com/user/repo/pull/123');
      expect(result).toBe(true);
    });

    it('should handle custom GitHub Enterprise hosts', async () => {
      (getGitHubHost as any).mockResolvedValue('github.company.com');

      const enterpriseResult = await isSupportedUrl('https://github.company.com/user/repo/pull/123');
      expect(enterpriseResult).toBe(true);

      const githubComResult = await isSupportedUrl('https://github.com/user/repo/pull/123');
      expect(githubComResult).toBe(false);
    });

    it('should handle URL parsing errors', async () => {
      // Invalid URL that will cause URL constructor to throw
      const result = await isSupportedUrl('not-a-valid-url');
      expect(result).toBe(false);
    });
  });

  describe('isOnPRPage', () => {
    // Save original window.location
    const originalLocation = window.location;

    beforeEach(() => {
      // Mock document.querySelector
      document.querySelector = vi.fn();
    });

    afterEach(() => {
      // Restore window.location
      Object.defineProperty(window, 'location', {
        value: originalLocation,
        writable: true,
      });
    });

    it('should return false if pathname does not include /pull/', () => {
      // Mock window.location
      Object.defineProperty(window, 'location', {
        value: { pathname: '/user/repo/issues/1' },
        writable: true,
      });

      const result = isOnPRPage();
      expect(result).toBe(false);
    });

    it('should return false if PR elements are not found', () => {
      // Mock window.location
      Object.defineProperty(window, 'location', {
        value: { pathname: '/user/repo/pull/123' },
        writable: true,
      });

      // Mock document.querySelector to return null (no PR elements)
      (document.querySelector as any).mockReturnValue(null);

      const result = isOnPRPage();
      expect(result).toBe(false);
    });

    it('should return true if pathname includes /pull/ and PR elements are found', () => {
      // Mock window.location
      Object.defineProperty(window, 'location', {
        value: { pathname: '/user/repo/pull/123' },
        writable: true,
      });

      // Mock document.querySelector to return an element
      (document.querySelector as any).mockReturnValue({ textContent: 'PR Title' });

      const result = isOnPRPage();
      expect(result).toBe(true);
    });
  });

  describe('extractPRInfo', () => {
    beforeEach(() => {
      // Mock document.querySelector and document.querySelectorAll
      document.querySelector = vi.fn();
      document.querySelectorAll = vi.fn().mockReturnValue([]);

      // Mock window.location
      Object.defineProperty(window, 'location', {
        value: { href: 'https://github.com/user/repo/pull/123' },
        writable: true,
      });
    });

    it('should extract PR title and URL', () => {
      // Mock PR title element
      (document.querySelector as any).mockImplementation((selector) => {
        if (selector === '.js-issue-title') {
          return { textContent: 'Test PR Title' };
        }
        return null;
      });

      const prInfo = extractPRInfo();

      expect(prInfo.title).toBe('Test PR Title');
      expect(prInfo.url).toBe('https://github.com/user/repo/pull/123');
    });

    it('should extract PR reviewers', () => {
      // Mock PR title element
      (document.querySelector as any).mockImplementation((selector) => {
        if (selector === '.js-issue-title') {
          return { textContent: 'Test PR Title' };
        }
        return null;
      });

      (document.querySelectorAll as any).mockImplementation((selector) => {
        if (
          selector ===
          ".js-issue-sidebar-form[aria-label='Select reviewers'] span[data-hovercard-type='user'] a.assignee"
        ) {
          return [{ textContent: 'reviewer1' }, { textContent: 'reviewer2' }];
        }
        return [];
      });

      const prInfo = extractPRInfo();

      expect(prInfo.reviewers).toEqual(['reviewer1', 'reviewer2']);
    });

    it('should extract PR author', () => {
      (document.querySelector as any).mockImplementation((selector) => {
        if (selector === '.js-issue-title') {
          return { textContent: 'Test PR Title' };
        }
        if (selector === '.timeline-comment-header-text .author') {
          return { textContent: 'author.name' };
        }
        return null;
      });

      const prInfo = extractPRInfo();

      expect(prInfo.author).toBe('author.name');
    });

    it('should extract lines of code changes', () => {
      // Mock PR title element
      (document.querySelector as any).mockImplementation((selector) => {
        if (selector === '.js-issue-title') {
          return { textContent: 'Test PR Title' };
        }
        if (selector === '.diffstat') {
          return {
            textContent: '\n  +100\n  -50\n',
          };
        }
        return null;
      });

      const prInfo = extractPRInfo();

      expect(prInfo.loc).toEqual(['+100', '-50']);
    });

    it('should handle extraction errors gracefully', () => {
      // Mock document.querySelector to throw an error
      (document.querySelector as any).mockImplementation(() => {
        throw new Error('DOM error');
      });

      // Mock window.location.pathname for fallback extraction
      Object.defineProperty(window.location, 'pathname', {
        value: '/user/repo/pull/123',
        writable: true,
      });

      const prInfo = extractPRInfo();

      // Should return minimal information
      expect(prInfo.title).toBe('GitHub PR');
      expect(prInfo.url).toBe('https://github.com/user/repo/pull/123');
      expect(prInfo.number).toBe('123');
      expect(prInfo.repo).toBe('user/repo');
    });
  });
});
