import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import '@units-core/zoom/zoomStore.js';
import { ZoomControls } from '@units-core';
import { OptionB } from './OptionB.jsx';

createRoot(document.getElementById('root')).render(<><ZoomControls /><OptionB /></>);
