import { StrictMode } from 'react'
import type { ComponentType } from 'react'
import { createRoot, Container } from 'react-dom/client'
import { StyledEngineProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import ScopedCssBaseline from '@mui/material/ScopedCssBaseline'
import { DialogsProvider } from '@toolpad/core/useDialogs'

import AppTheme from './theme/AppTheme'
import './index.less'

export function Renderer(
  App: ComponentType<unknown>,
  container: Container = document.getElementById('root')!,
  scopedCssBaseLine = false,
) {
  const BaseLine = scopedCssBaseLine ? ScopedCssBaseline : CssBaseline

  createRoot(container!).render(
    <StrictMode>
      <StyledEngineProvider injectFirst>
        <AppTheme>
          <BaseLine enableColorScheme />
          <DialogsProvider>
            <App />
          </DialogsProvider>
        </AppTheme>
      </StyledEngineProvider>
    </StrictMode>,
  )
}
