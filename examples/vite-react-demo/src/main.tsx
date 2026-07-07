import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { PrinterProvider } from 'detonger-web-bt/react'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PrinterProvider
      config={{ debug: false, paperWidth: 56 }}
      autoDisconnectOnUnmount={true}
    >
      <App />
    </PrinterProvider>
  </StrictMode>,
)
