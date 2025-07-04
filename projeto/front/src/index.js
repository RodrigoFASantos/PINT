/**
 * Ponto de entrada principal da aplicação React
 * 
 * Este ficheiro é responsável por:
 * - Criar a raiz da aplicação React
 * - Renderizar o componente App principal
 * - Configurar o StrictMode para desenvolvimento
 * - Inicializar métricas de performance (se necessário)
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Criar a raiz da aplicação React no elemento DOM com id 'root'
const root = ReactDOM.createRoot(document.getElementById('root'));

// Renderizar a aplicação
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Opcional: Medir performance da aplicação
// Passar uma função para registar resultados (por exemplo: reportWebVitals(console.log))
// ou enviar para um endpoint de analytics. Saiba mais: https://bit.ly/CRA-vitals
reportWebVitals();