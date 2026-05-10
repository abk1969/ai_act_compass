import React from 'react';
import { createRoot } from 'react-dom/client';
import './design/design.css';
import App from '../ai-act-compass.jsx';

const root = createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
