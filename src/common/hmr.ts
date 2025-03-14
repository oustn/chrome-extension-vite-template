if (import.meta.env.DEV) {
  const ws = new WebSocket('ws://localhost:2333')

  ws.onopen = () => {
    const keepAliveIntervalId = setInterval(
      () => {
        if (ws) {
          ws.send('keepalive')
        } else {
          clearInterval(keepAliveIntervalId)
        }
      },
      // Set the interval to 20 seconds to prevent the service worker from becoming inactive.
      20 * 1000,
    )
  }
  ws.onmessage = () => {
    // const msg: { type: string } = JSON.parse(event.data)
    chrome?.runtime?.reload?.()
    setTimeout(() => {
      window?.location?.reload?.()
    }, 100)
  }
}
