import Container from '@mui/material/Container'
import Button from '@mui/material/Button'
import { Robot } from '@/common'

export function App() {
  const handleClick = () => {
    const robot = Robot.get()
    robot.send('hello')
  }

  return (
    <Container>
      <Button variant="contained" onClick={handleClick}>
        Try it!
      </Button>
    </Container>
  )
}
