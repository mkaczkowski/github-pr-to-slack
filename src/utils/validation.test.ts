import { describe, it, expect } from 'vitest';
import { isValidSlackWebhookUrl, isValidGitHubHost, cleanHostname } from './validation';

describe('Validation Utilities', () => {
  describe('isValidSlackWebhookUrl', () => {
    it('should return true for valid Slack webhook URLs', () => {
      const validUrls = [
        'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX',
        'https://hooks.slack.com/services/ABC123/DEF456/GHI789',
      ];

      validUrls.forEach((url) => {
        expect(isValidSlackWebhookUrl(url)).toBe(true);
      });
    });

    it('should return false for invalid Slack webhook URLs', () => {
      const invalidUrls = [
        'http://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX', // Not HTTPS
        'https://api.slack.com/webhook', // Wrong path
        'https://example.com/webhook',
        'not-a-url',
      ];

      invalidUrls.forEach((url) => {
        expect(isValidSlackWebhookUrl(url)).toBe(false);
      });
    });

    it('should return true for empty URL', () => {
      // According to the implementation, empty URLs are considered valid
      // (though not useful) to allow for optional fields
      expect(isValidSlackWebhookUrl('')).toBe(true);
    });
  });

  describe('isValidGitHubHost', () => {
    it('should return true for valid GitHub hosts', () => {
      const validHosts = ['github.com', 'github.company.com', 'gh.internal-domain.org', 'ghe.example.com'];

      validHosts.forEach((host) => {
        expect(isValidGitHubHost(host)).toBe(true);
      });
    });

    it('should return false for invalid GitHub hosts', () => {
      const invalidHosts = [
        'github.com/user/repo', // Contains path
        'https://github.com', // Contains protocol
        'github.com?query=value', // Contains query
        'not a valid hostname', // Contains spaces
        'github.com:8080', // Contains port
      ];

      invalidHosts.forEach((host) => {
        expect(isValidGitHubHost(host)).toBe(false);
      });
    });

    it('should return true for empty host', () => {
      // According to the implementation, empty hosts are considered valid
      // to allow for default (github.com)
      expect(isValidGitHubHost('')).toBe(true);
    });
  });

  describe('cleanHostname', () => {
    it('should remove protocol from hostname', () => {
      expect(cleanHostname('http://github.com')).toBe('github.com');
      expect(cleanHostname('https://github.company.com')).toBe('github.company.com');
    });

    it('should remove trailing slashes', () => {
      expect(cleanHostname('github.com/')).toBe('github.com');
      expect(cleanHostname('github.company.com//')).toBe('github.company.com');
    });

    it('should handle hostnames without protocol or trailing slashes', () => {
      expect(cleanHostname('github.com')).toBe('github.com');
      expect(cleanHostname('github.company.com')).toBe('github.company.com');
    });

    it('should return empty string for empty input', () => {
      expect(cleanHostname('')).toBe('');
    });

    it('should handle complex cases', () => {
      expect(cleanHostname('https://github.company.com/')).toBe('github.company.com');
      expect(cleanHostname('http://github.com//')).toBe('github.com');
    });
  });
});
