import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async' // 🛠️ ADDED: Helmet Provider
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* 🛠️ ADDED: Wrapped the entire app */}
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </StrictMode>,
)