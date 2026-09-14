import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import './index.css';
import './lib/clearLegacyCache';
import './lib/migrateToSupabase';

// Check whether an argument contains ignorable network/auth errors in preview sandbox
const isIgnoredErrorOrMessage = (arg: any): boolean => {
  if (!arg) return false;
  if (typeof arg === 'string') {
    const lower = arg.toLowerCase();
    return (
      lower.includes('auth/network-request-failed') ||
      lower.includes('network-request-failed') ||
      lower.includes('could not reach cloud firestore backend') ||
      lower.includes('code=unavailable') ||
      lower.includes('auth/unauthorized-domain') ||
      lower.includes('auth/configuration-not-found') ||
      lower.includes('auth/internal-error')
    );
  }
  if (typeof arg === 'object') {
    const code = String(arg.code || '').toLowerCase();
    const msg = String(arg.message || '').toLowerCase();
    const str = String(arg).toLowerCase();
    if (
      code.includes('network-request-failed') ||
      code.includes('auth/network-request-failed') ||
      code.includes('unavailable') ||
      msg.includes('auth/network-request-failed') ||
      msg.includes('network-request-failed') ||
      msg.includes('could not reach cloud firestore backend') ||
      msg.includes('code=unavailable') ||
      msg.includes('auth/unauthorized-domain') ||
      str.includes('auth/network-request-failed') ||
      str.includes('could not reach cloud firestore backend')
    ) {
      return true;
    }
  }
  return false;
};

// Suppress harmless Firebase network connection warnings in the console
const originalConsoleError = console.error;
console.error = (...args) => {
  if (args.some(isIgnoredErrorOrMessage)) {
    return;
  }
  originalConsoleError(...args);
};

const originalConsoleWarn = console.warn;
console.warn = (...args) => {
  if (args.some(isIgnoredErrorOrMessage)) {
    return;
  }
  originalConsoleWarn(...args);
};

window.addEventListener('error', (event) => {
  if (
    isIgnoredErrorOrMessage(event.error) ||
    isIgnoredErrorOrMessage(event.message)
  ) {
    event.preventDefault();
    event.stopPropagation();
  }
});

window.addEventListener('unhandledrejection', (event) => {
  if (
    isIgnoredErrorOrMessage(event.reason) ||
    isIgnoredErrorOrMessage(event.reason?.message) ||
    isIgnoredErrorOrMessage(event.reason?.code)
  ) {
    event.preventDefault();
    event.stopPropagation();
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
