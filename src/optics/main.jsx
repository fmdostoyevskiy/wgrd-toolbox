import '../index.css';
import './styles.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import '@units-core/zoom/zoomStore.js';
import '@units-core/theme/themeStore.js';
import { App } from './Optics.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
