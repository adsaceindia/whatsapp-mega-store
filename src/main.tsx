import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { HelmetProvider } from 'react-helmet-async';
import App from './App.tsx';
import './index.css';
import { CartProvider } from './context/CartContext.tsx';
import { StoreConfigProvider } from './context/StoreConfigContext.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <StoreConfigProvider>
        <CartProvider>
          <HelmetProvider>
            <App />
          </HelmetProvider>
        </CartProvider>
      </StoreConfigProvider>
    </BrowserRouter>
  </StrictMode>,
);
