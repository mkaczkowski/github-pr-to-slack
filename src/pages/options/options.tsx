/**
 * Options page script for the GitHub PR to Slack extension
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { debug } from '../../utils/chrome-polyfill';

// Import styles directly - this will be handled by webpack
import './options.css';
import '../../theme-switcher.css';

// Add more extensive logging
debug.log('Options', 'Options page script started');
debug.log('Options', 'React version', { version: React.version });
debug.log('Options', 'Current URL', { url: window.location.href });

// Add window error handler to catch any uncaught exceptions
window.addEventListener('error', function (event) {
  debug.error('Options', 'Global error caught', event.error);
  const fallbackElement = document.getElementById('fallback');
  if (fallbackElement) {
    fallbackElement.style.display = 'block';

    // Add error details to the fallback div
    const errorDetails = document.createElement('div');
    errorDetails.style.color = 'red';
    errorDetails.style.margin = '20px';
    errorDetails.style.textAlign = 'left';
    errorDetails.innerHTML = `<h3>Error Details:</h3><p>${event.message}</p><pre>${
      event.error?.stack || 'No stack trace available'
    }</pre>`;
    fallbackElement.appendChild(errorDetails);
  }
});

// Simplified rendering approach
document.addEventListener('DOMContentLoaded', () => {
  debug.log('Options', 'DOM content loaded');

  try {
    const root = document.getElementById('root');

    if (!root) {
      throw new Error('Could not find #root element');
    }

    // First, render simple content to verify DOM rendering works
    root.innerHTML = `
      <div class="loading-indicator">
        <p>Loading options page...</p>
      </div>
    `;

    // Then attempt to render the React component
    setTimeout(() => {
      try {
        ReactDOM.createRoot(root).render(
          <React.StrictMode>
            <App />
          </React.StrictMode>,
        );
        debug.log('Options', 'App component rendered successfully');
      } catch (appError) {
        debug.error('Options', 'Error rendering App component', appError);
        root.innerHTML = `
          <div style="color: red; padding: 20px;">
            <h2>Error Loading App</h2>
            <p>There was an error loading the options page:</p>
            <pre>${(appError as Error).message}</pre>
            <p>Please check the console for more details.</p>
          </div>
        `;
      }
    }, 500);
  } catch (error) {
    debug.error('Options', 'Fatal error initializing options page', error);
    document.body.innerHTML = `
      <div style="color: red; padding: 20px;">
        <h2>Fatal Error</h2>
        <p>There was a fatal error loading the options page:</p>
        <pre>${(error as Error).message}</pre>
        <p>Please check the console for more details.</p>
      </div>
    `;
  }
});
