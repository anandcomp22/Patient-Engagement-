import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));

// Google Fit OAuth Popup Callback Handler
if (window.opener && (window.location.hash.includes("access_token") || window.location.hash.includes("error="))) {
  const hashParams = new URLSearchParams(window.location.hash.substring(1));
  const accessToken = hashParams.get("access_token");
  const error = hashParams.get("error");
  
  if (accessToken) {
    window.opener.postMessage({ access_token: accessToken }, window.location.origin);
  } else if (error) {
    window.opener.postMessage({ error: error }, window.location.origin);
  } else {
    window.close(); // Fallback close
  }
} else {
  root.render(<App />);
}

reportWebVitals();
