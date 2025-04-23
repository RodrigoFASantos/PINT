import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import reportWebVitals from './reportWebVitals';


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {console.log('index.js: Dentro do StrictMode')}
    <App />
  </React.StrictMode>
);

reportWebVitals();