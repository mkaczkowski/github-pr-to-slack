# Integration Tests

This directory contains integration tests for the GitHub PR to Slack Chrome extension. These tests verify that different components of the application work together correctly.

## Test Structure

The integration tests are organized into the following categories:

1. **Component Integration Tests**

   - `SlackPopupIntegration.test.tsx`: Tests the SlackPopup component with useSlack and useGithubPR hooks
   - `OptionsPageIntegration.test.tsx`: Tests the Options page with storage utilities

2. **Theme Switching Tests**

   - `ThemeSwitchingIntegration.test.tsx`: Tests theme switching across components

3. **Background-Content Communication Tests**

   - `BackgroundContentCommunication.test.ts`: Tests message passing between background and content scripts

4. **SPA Navigation Handling Tests**
   - `SPANavigationHandling.test.ts`: Tests history API overrides and mutation observers

## Running the Tests

To run the integration tests, use the following command:

```bash
npm run test
```

To run a specific test file:

```bash
npm run test -- src/test/integration/SlackPopupIntegration.test.tsx
```

## Test Mocks

The integration tests use the following mocks:

- Chrome API mocks from `src/test/mocks/chrome.ts`
- React hooks mocks for useGithubPR and useSlack
- DOM API mocks for MutationObserver and History API

## Test Coverage

These integration tests cover:

1. Component interactions and data flow
2. Theme switching and persistence
3. Message passing between background and content scripts
4. Error handling and recovery
5. SPA navigation handling with history API and mutation observers

## Adding New Tests

When adding new integration tests, follow these guidelines:

1. Create a new test file in the `src/test/integration` directory
2. Use the existing mocks and utilities
3. Focus on testing component interactions rather than individual functions
4. Test both success and error scenarios
5. Test edge cases and boundary conditions
