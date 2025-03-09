import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useGithubPR } from './useGithubPR';
import { extractPRInfo } from '../../../utils/github';

// Mock the github module
vi.mock('../../../utils/github', () => ({
  extractPRInfo: vi.fn(),
}));

// Mock the chrome-polyfill module
vi.mock('../../../utils/chrome-polyfill', () => ({
  debug: {
    log: vi.fn(),
    error: vi.fn(),
  },
}));

describe('useGithubPR Hook', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should extract PR info on initialization', () => {
    // Mock PR info
    const mockPRInfo = {
      title: 'Test PR Title',
      url: 'https://github.com/user/repo/pull/123',
      reviewers: ['user1', 'user2'],
      loc: ['+100', '-50'],
    };

    // Setup mock implementation
    (extractPRInfo as any).mockReturnValue(mockPRInfo);

    // Render the hook
    const { result } = renderHook(() => useGithubPR());

    // Verify extractPRInfo was called
    expect(extractPRInfo).toHaveBeenCalled();

    // Verify the returned PR info
    expect(result.current.prInfo).toEqual(mockPRInfo);
  });

  it('should handle errors during PR info extraction', () => {
    // Setup mock implementation to throw an error
    (extractPRInfo as any).mockImplementation(() => {
      throw new Error('Extraction error');
    });

    // Render the hook
    const { result } = renderHook(() => useGithubPR());

    // Verify the PR info is null
    expect(result.current.prInfo).toBeNull();
  });

  describe('generatePreviewMessage', () => {
    it('should generate a preview message with basic PR info', () => {
      // Mock PR info
      const mockPRInfo = {
        title: 'Test PR Title',
        url: 'https://github.com/user/repo/pull/123',
      };

      // Setup mock implementation
      (extractPRInfo as any).mockReturnValue(mockPRInfo);

      // Render the hook
      const { result } = renderHook(() => useGithubPR());

      // Generate preview message
      const previewMessage = result.current.generatePreviewMessage();

      // Verify the preview message
      expect(previewMessage).toContain('*Test PR Title*');
      expect(previewMessage).toContain('https://github.com/user/repo/pull/123');
    });

    it('should include reviewers in the preview message', () => {
      // Mock PR info with reviewers
      const mockPRInfo = {
        title: 'Test PR Title',
        url: 'https://github.com/user/repo/pull/123',
        reviewers: ['user1', 'user2'],
      };

      // Setup mock implementation
      (extractPRInfo as any).mockReturnValue(mockPRInfo);

      // Render the hook
      const { result } = renderHook(() => useGithubPR());

      // Generate preview message
      const previewMessage = result.current.generatePreviewMessage();

      // Verify the preview message includes reviewers
      expect(previewMessage).toContain('assigned: @user1, @user2');
    });

    it('should include lines of code changes in the preview message', () => {
      // Mock PR info with loc
      const mockPRInfo = {
        title: 'Test PR Title',
        url: 'https://github.com/user/repo/pull/123',
        loc: ['+100', '-50'],
      };

      // Setup mock implementation
      (extractPRInfo as any).mockReturnValue(mockPRInfo);

      // Render the hook
      const { result } = renderHook(() => useGithubPR());

      // Generate preview message
      const previewMessage = result.current.generatePreviewMessage();

      // Verify the preview message includes loc
      expect(previewMessage).toContain('(+100, -50)');
    });

    it('should sanitize reviewer names', () => {
      // Mock PR info with reviewers containing special characters
      const mockPRInfo = {
        title: 'Test PR Title',
        url: 'https://github.com/user/repo/pull/123',
        reviewers: ['user.name', 'user@email.com'],
      };

      // Setup mock implementation
      (extractPRInfo as any).mockReturnValue(mockPRInfo);

      // Render the hook
      const { result } = renderHook(() => useGithubPR());

      // Generate preview message
      const previewMessage = result.current.generatePreviewMessage();

      // Verify the preview message sanitizes reviewer names
      expect(previewMessage).toContain('@username');
      expect(previewMessage).toContain('@useremailcom');
    });

    it('should return a default message if PR info is null', () => {
      // Setup mock implementation to return null
      (extractPRInfo as any).mockImplementation(() => {
        throw new Error('Extraction error');
      });

      // Render the hook
      const { result } = renderHook(() => useGithubPR());

      // Generate preview message
      const previewMessage = result.current.generatePreviewMessage();

      // Verify the default message
      expect(previewMessage).toBe('Please enter your message here...');
    });
  });
});
