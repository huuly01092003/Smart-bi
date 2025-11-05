import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// CSS cho AG-Grid và Leaflet
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);