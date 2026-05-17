import React from 'react';
import ReactDOM from 'react-dom/client';
import '../index.css';
import './layout.css';
import '@units-core/zoom/zoomStore.js';
import { ZoomControls } from '@units-core';
import { Home } from './Home.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(<><ZoomControls /><Home /></>);
