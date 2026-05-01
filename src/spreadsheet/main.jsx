import React from 'react';
import ReactDOM from 'react-dom/client';
import { SpreadsheetApp } from './SpreadsheetApp.jsx';
import { DATASETS } from './datasets.js';
import './styles.css';

const params = new URLSearchParams(window.location.search);
const dsKey  = params.get('ds') ?? 'spaags';
const dataset = DATASETS[dsKey] ?? DATASETS['spaags'];

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <SpreadsheetApp dataset={dataset} />
  </React.StrictMode>
);
