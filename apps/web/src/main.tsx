import { StrictMode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import * as ReactDOM from 'react-dom/client';
import { PostHogProvider } from 'posthog-js/react';
import App from './app/app';

// grab posthog config from env
const posthogKey = import.meta.env.VITE_POSTHOG_KEY;
const posthogHost = import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <StrictMode>
    <PostHogProvider
      apiKey={posthogKey}
      options={{
        api_host: posthogHost,
        // Disable heavy features we don't need
        disable_session_recording: true,
        disable_surveys: true,
        autocapture: false, // Only capture explicit events
        capture_pageview: true,
        capture_pageleave: true,
      }}
    >
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </PostHogProvider>
  </StrictMode>
);
