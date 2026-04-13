import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import PinGate from './PinGate.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PinGate>
      <App />
    </PinGate>
  </StrictMode>,
)
