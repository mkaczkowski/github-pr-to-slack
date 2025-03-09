# Testing Infrastructure

This directory contains the testing infrastructure for the Send PR to Slack Chrome extension.

## Overview

The testing strategy follows a layered approach:

1. **Unit Tests**: Testing individual components and functions in isolation
2. **Integration Tests**: Testing interactions between components
3. **End-to-End Tests**: Testing critical user flows

## Testing Frameworks and Tools

- **Vitest**: Primary test runner and assertion library
- **React Testing Library**: Testing React components and hooks
- **Happy DOM**: DOM implementation for testing
- **@testing-library/user-event**: Simulating user interactions

## Directory Structure

```
src/test/
├── README.md                 # This file
├── setup.ts                  # Global test setup
├── mocks/                    # Mock implementations
│   └── chrome.ts             # Chrome API mocks
├── fixtures/                 # Test data
│   └── index.ts              # Common test fixtures
└── utils/                    # Testing utilities
    └── testing-library.tsx   # Custom render function
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests with UI
npm run test:ui
```

## Writing Tests

### Component Tests

Use React Testing Library to test components. Example:

```tsx
import { render, screen } from '../../test/utils/testing-library';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

### Chrome API Tests

Use the Chrome API mocks to test interactions with Chrome APIs. Example:

```tsx
import { chromeMock, mockChromeStorageSync } from '../../test/mocks/chrome';

describe('Chrome Storage', () => {
  it('saves data to storage', async () => {
    // Setup
    const data = { key: 'value' };

    // Test
    await saveToStorage(data);

    // Assert
    expect(chromeMock.storage.sync.set).toHaveBeenCalledWith(data, expect.any(Function));
  });
});
```

### Using Test Fixtures

Use the test fixtures to create test data:

```tsx
import { samplePullRequest, createSlackConfig } from '../../test/fixtures';

describe('PR Formatter', () => {
  it('formats PR data correctly', () => {
    const pr = samplePullRequest;
    const config = createSlackConfig({ defaultChannel: '#testing' });

    const result = formatPR(pr, config);

    expect(result).toContain('#testing');
    expect(result).toContain(pr.title);
  });
});
```

## Best Practices

1. **Isolation**: Each test should be independent and not rely on the state from other tests
2. **Mocking**: Use mocks for external dependencies (Chrome APIs, network requests)
3. **Coverage**: Aim for high test coverage, especially for critical paths
4. **Readability**: Write clear, descriptive test names and assertions
5. **Maintainability**: Keep tests simple and focused on a single behavior

## Chrome API Mocking

The `chrome.ts` mock provides comprehensive mocking for Chrome extension APIs:

- `chrome.storage`: For testing storage operations
- `chrome.runtime`: For testing message passing
- `chrome.tabs`: For testing tab operations
- And more...

Helper functions are provided for common mocking scenarios:

- `mockChromeStorageSync`: Configure storage mock data
- `mockRuntimeSendMessage`: Configure runtime message responses
- `mockTabsQuery`: Configure tab query responses

# Testing Guidelines

This document outlines the best practices for writing tests in this project, with a focus on mocking strategies.

## Mocking Strategy

### 1. Use Shared Mock Setup

We have centralized mock implementations in the `setupMocks.ts` file. Always use these shared mocks instead of creating inline mocks in your test files.

```typescript
// Good
import { setupChromePolyfillMock } from '../test/setupMocks';
setupChromePolyfillMock();

// Bad
vi.mock('../../utils/chrome-polyfill', () => ({
  debug: {
    log: vi.fn(),
    error: vi.fn(),
  },
}));
```

### 2. Use Standardized Test Setup

Use the standardized test setup functions from `testSetup.ts` to ensure consistent test setup and cleanup.

```typescript
import { setupTestEnvironment } from '../test/testSetup';

setupTestEnvironment(() => {
  // Your setup code here
});
```

### 3. Improve Type Safety with vi.mocked()

Always use `vi.mocked()` instead of type casting with `as any` to maintain type safety.

```typescript
// Good
expect(vi.mocked(chromeMock.storage.sync.get)).toHaveBeenCalledWith('key', expect.any(Function));

// Bad
expect(chromeMock.storage.sync.get as any).toHaveBeenCalledWith('key', expect.any(Function));
```

### 4. Use Consistent Mock Reset Strategy

Always use `vi.resetAllMocks()` in the `beforeEach` hook to ensure tests start with clean mocks. This is handled automatically by the `setupTestEnvironment` function.

### 5. Use Factory Functions for Configurable Mocks

Use the factory functions in `setupMocks.ts` to create configurable mocks.

```typescript
const slackMocks = setupSlackMock({
  isConfigured: true,
  statusMessage: { text: 'Success', type: 'success' },
});
```

### 6. Verify Mock Calls

Always verify that mocks were called with the expected arguments.

```typescript
expect(vi.mocked(mockFunction)).toHaveBeenCalledWith(expectedArg);
expect(vi.mocked(mockFunction)).toHaveBeenCalledTimes(1);
```

### 7. Use Consistent Module Mocking Style

Use the direct object style for mocking modules.

```typescript
vi.mock('module-name', () => ({
  exportedFunction: vi.fn(),
  ExportedComponent: () => null,
}));
```

## Test Structure

### 1. Arrange-Act-Assert Pattern

Structure your tests using the Arrange-Act-Assert pattern:

```typescript
it('should do something', async () => {
  // Arrange
  const mockData = { key: 'value' };
  vi.mocked(someFunction).mockResolvedValue(mockData);

  // Act
  const result = await functionUnderTest();

  // Assert
  expect(result).toEqual(mockData);
  expect(vi.mocked(someFunction)).toHaveBeenCalledTimes(1);
});
```

### 2. Descriptive Test Names

Use descriptive test names that clearly state what the test is verifying:

```typescript
// Good
it('should return the stored GitHub host when it exists in storage', async () => {
  // ...
});

// Bad
it('test getGitHubHost', async () => {
  // ...
});
```

### 3. Group Related Tests

Group related tests using `describe` blocks:

```typescript
describe('getGitHubHost', () => {
  it('should return the stored GitHub host', async () => {
    // ...
  });

  it('should return the default GitHub host if none is stored', async () => {
    // ...
  });

  it('should handle errors when retrieving the GitHub host', async () => {
    // ...
  });
});
```

## Common Mocks

### 1. Chrome API

Use the `chromeMock` from `mocks/chrome.ts` for mocking Chrome API calls.

### 2. React Hooks

Use the hook setup functions from `setupMocks.ts` for mocking React hooks.

### 3. Storage

Use the `setupStorageMock` function from `setupMocks.ts` for mocking storage utilities.

### 4. React Hook Form

Use the `setupReactHookFormMock` function from `setupMocks.ts` for mocking React Hook Form.
