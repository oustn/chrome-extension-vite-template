import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { greeting } from '../common'
import './index.less'
import App from './App.tsx'

greeting('popup')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
