import { describe, it, expect, vi } from 'vitest';
import { setupReactDomMock, setupChromePolyfillMock } from '../../test/setupMocks';
import { setupTestEnvironment } from '../../test/testSetup';

// Set up test environment
setupTestEnvironment(() => {
  // Set up common mocks
  setupReactDomMock();
  setupChromePolyfillMock();

  // Mock App component
  vi.mock('./App', () => ({
    default: vi.fn(() => null),
  }));
});

describe('Options Page', () => {
  it('should import without errors', () => {
    // This test just verifies that the module can be imported without errors
    expect(() => {
      // We need to use require here to ensure the module is executed
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require('./options');
    }).not.toThrow();
  });
});
