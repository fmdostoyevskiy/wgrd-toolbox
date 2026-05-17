import '../index.css';
import './styles.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import '@units-core/zoom/zoomStore.js';
import { ZoomControls } from '@units-core';
import { App } from './Optics.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(<><ZoomControls /><App /></>);
