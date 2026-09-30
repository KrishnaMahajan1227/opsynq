import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import {installVitePreloadRecovery} from './core/lazyLoad';
import './styles/index.css';
installVitePreloadRecovery();
createRoot(document.getElementById('root')).render(<React.StrictMode><App/></React.StrictMode>);
