import { useState, MouseEvent } from 'react'
import Container from '@mui/material/Container'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import { useColorScheme } from '@mui/material/styles'
import LightModeIcon from '@mui/icons-material/LightMode'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import SystemModeIcon from '@mui/icons-material/SettingsBrightness'

import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.less'

type Mode = 'light' | 'dark' | 'system'

function App() {
  const [count, setCount] = useState(0)
  const { mode = 'system', setMode } = useColorScheme()

  const handleChange = (_event: MouseEvent<HTMLElement>, newMode: Mode) => {
    setMode(newMode)
  }

  return (
    <Container sx={{ minWidth: 320 }}>
      <Box className="text-right" sx={{ p: 2 }}>
        <ToggleButtonGroup
          size="small"
          color="primary"
          value={mode}
          exclusive
          onChange={handleChange}
          aria-label="Platform"
        >
          <ToggleButton value="light">
            <LightModeIcon sx={{ mr: 1 }} />
            Light
          </ToggleButton>
          <ToggleButton value="system">
            <SystemModeIcon sx={{ mr: 1 }} />
            System
          </ToggleButton>
          <ToggleButton value="dark">
            <DarkModeIcon sx={{ mr: 1 }} />
            Dark
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>
      <div className="flex justify-around">
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <Typography variant="h1" textAlign="center">
        Vite + React
      </Typography>
      <Paper
        className="text-center"
        elevation={3}
        sx={{ p: 2, marginBlock: 2 }}
      >
        <Button
          variant="contained"
          onClick={() => setCount((count) => count + 1)}
        >
          count is {count}
        </Button>
        <Typography sx={{ mt: 2 }}>
          Edit <code>src/App.tsx</code> and save to test HMR
        </Typography>
      </Paper>
      <Typography
        variant="subtitle2"
        sx={{ paddingBlock: 2 }}
        color="textDisabled"
      >
        Click on the Vite and React logos to learn more
      </Typography>
    </Container>
  )
}

export default App
