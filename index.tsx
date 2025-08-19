import React from 'react';
import ReactDOM from 'react-dom/client';
import { PublicClientApplication } from '@azure/msal-browser';
import { msalConfig } from './constants';
import App from './App';

const msalInstance = new PublicClientApplication(msalConfig);

// It's important to call and wait for MSAL's initialize function before rendering.
msalInstance.initialize().then(() => {
    const rootElement = document.getElementById('root');
    if (!rootElement) {
      throw new Error("Could not find root element to mount to");
    }

    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App pca={msalInstance} />
      </React.StrictMode>
    );
});