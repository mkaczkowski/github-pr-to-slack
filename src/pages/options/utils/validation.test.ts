import { describe, it, expect } from 'vitest';
import { isValidSlackWebhookUrl, isValidGitHubHost, cleanHostname } from './validation';

describe('Options Page Validation Utilities', () => {
  describe('isValidSlackWebhookUrl', () => {
    it('should return true for valid Slack webhook URLs', () => {
      const validUrls = [
        'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX',
        'https://hooks.slack.com/services/ABC123/DEF456/GHI789JKL',
        'https://hooks.slack.com/services/T12345/B67890/ABCDEFGHIJKLMNOPQRSTUV',
      ];

      validUrls.forEach((url) => {
        expect(isValidSlackWebhookUrl(url)).toBe(true);
      });
    });

    it('should return false for invalid Slack webhook URLs', () => {
      const invalidUrls = [
        'http://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX', // Not HTTPS
        'https://api.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX', // Wrong domain
        'https://hooks.slack.com/api/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX', // Wrong path
        'https://hooks.slack.com', // Missing path
        'hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX', // Missing protocol
        'https://example.com', // Completely wrong URL
        'not-a-url',
        '',
      ];

      invalidUrls.forEach((url) => {
        expect(isValidSlackWebhookUrl(url)).toBe(url === ''); // Empty string is considered valid
      });
    });

    it('should handle empty input', () => {
      expect(isValidSlackWebhookUrl('')).toBe(true);
      expect(isValidSlackWebhookUrl(undefined as unknown as string)).toBe(true);
    });
  });

  describe('isValidGitHubHost', () => {
    it('should return true for valid GitHub hosts', () => {
      const validHosts = [
        'github.com',
        'github.mycompany.com',
        'gh.internal.example.org',
        'ghe.company.co.uk',
        'a.b.c.d.e.f.g',
        'x-y-z.example.com',
      ];

      validHosts.forEach((host) => {
        expect(isValidGitHubHost(host)).toBe(true);
      });
    });

    it('should return false for invalid GitHub hosts', () => {
      const invalidHosts = [
        'github.com/',
        'http://github.com',
        'https://github.com',
        'github.com/user/repo',
        'github.com?query=value',
        'github.com#fragment',
        'github.com:8080',
        'user@github.com',
        'github com',
        'github..com',
        '.github.com',
        'github.com.',
        '-github.com',
        'github.com-',
      ];

      invalidHosts.forEach((host) => {
        expect(isValidGitHubHost(host)).toBe(false);
      });
    });

    it('should handle empty input', () => {
      expect(isValidGitHubHost('')).toBe(true);
      expect(isValidGitHubHost(undefined as unknown as string)).toBe(true);
    });
  });

  describe('cleanHostname', () => {
    it('should remove protocol prefixes', () => {
      expect(cleanHostname('http://github.com')).toBe('github.com');
      expect(cleanHostname('https://github.com')).toBe('github.com');
      expect(cleanHostname('http://github.mycompany.com')).toBe('github.mycompany.com');
      expect(cleanHostname('https://github.mycompany.com')).toBe('github.mycompany.com');
    });

    it('should remove trailing slashes', () => {
      expect(cleanHostname('github.com/')).toBe('github.com');
      expect(cleanHostname('github.mycompany.com/')).toBe('github.mycompany.com');
      expect(cleanHostname('http://github.com/')).toBe('github.com');
      expect(cleanHostname('https://github.com/')).toBe('github.com');
    });

    it('should handle complex cases', () => {
      expect(cleanHostname('https://github.mycompany.com/')).toBe('github.mycompany.com');
      expect(cleanHostname('  http://github.com/  ')).toBe('github.com');
      expect(cleanHostname('  https://github.mycompany.com/  ')).toBe('github.mycompany.com');
    });

    it('should handle empty input', () => {
      expect(cleanHostname('')).toBe('');
      expect(cleanHostname('   ')).toBe('');
      expect(cleanHostname(undefined as unknown as string)).toBe('');
    });

    it('should preserve hostnames without protocol or trailing slash', () => {
      expect(cleanHostname('github.com')).toBe('github.com');
      expect(cleanHostname('github.mycompany.com')).toBe('github.mycompany.com');
      expect(cleanHostname('ghe.internal.example.org')).toBe('ghe.internal.example.org');
    });
  });
});
