import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import {installVitePreloadRecovery} from './lazyLoad';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';

installVitePreloadRecovery();
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <div className="crm-app">
      <App />
    </div>
  </React.StrictMode>
);
