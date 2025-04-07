import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import reportWebVitals from './reportWebVitals';

console.log('index.js: Inicializando aplicação React');

const root = ReactDOM.createRoot(document.getElementById('root'));
console.log('index.js: Renderizando App no root');
root.render(
  <React.StrictMode>
    {console.log('index.js: Dentro do StrictMode')}
    <App />
  </React.StrictMode>
);

reportWebVitals();