import { StrictMode } from 'react'
import type { ComponentType } from 'react'
import { createRoot } from 'react-dom/client'
import { StyledEngineProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { DialogsProvider } from '@toolpad/core/useDialogs'

import AppTheme from './theme/AppTheme'
import './index.less'

export function Renderer(App: ComponentType<unknown>) {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <StyledEngineProvider injectFirst>
        <AppTheme>
          <CssBaseline enableColorScheme />
          <DialogsProvider>
            <App />
          </DialogsProvider>
        </AppTheme>
      </StyledEngineProvider>
    </StrictMode>,
  )
}
