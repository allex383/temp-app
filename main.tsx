import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App'; // Убедитесь, что здесь нет .tsx в конце, если это вызывает ошибку
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
