if (import.meta.env.DEV) {
  const ws = new WebSocket('ws://localhost:2333')

  ws.onmessage = (event) => {
    const msg: { type: string } = JSON.parse(event.data)
    if (msg.type === 'reload') {
      chrome?.runtime?.reload?.()
      setTimeout(() => {
        window?.location?.reload?.()
      }, 100)
    } else if (msg.type === 'refresh' && typeof window !== 'undefined') {
      window?.location?.reload?.()
    }
  }
}
