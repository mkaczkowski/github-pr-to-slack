import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';

/**
 * Custom render function that includes common providers
 */
const customRender = (ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'> & { route?: string }) => {
  const { route = '/', ...renderOptions } = options || {};

  // Set up window.location for the test
  window.history.pushState({}, 'Test page', route);

  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return <BrowserRouter>{children}</BrowserRouter>;
  };

  return {
    user: userEvent.setup(),
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
};

// Re-export everything from testing-library
export * from '@testing-library/react';

// Override render method
export { customRender as render };
