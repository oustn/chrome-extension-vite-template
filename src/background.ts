import { Robot } from '@/common'

const robot = Robot.get()

robot.on('hello', () => {
  chrome.notifications.create({
    title: 'Hello world!',
    type: 'basic',
    message: '点击查看示例网站: https://example.com',
    iconUrl: '/icons/vite_128.png',
  })
})
