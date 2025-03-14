import { ContentRobot, Robot } from '@/common'
const injectScript = (file: string, node: string) => {
  const th = document.querySelector(node)
  const s = document.createElement('script')
  s.setAttribute('type', 'text/javascript')
  s.setAttribute('src', file)
  s.setAttribute('type', 'module')
  th?.appendChild(s)
}

// 注入 script，与 content script 不一样，注入的脚本是在目标网站的上下文，可以获取 content
// script 无权限的内容
injectScript(getAssetURL('src/injects/index.ts'), 'body')

const robot = Robot.get<ContentRobot>()

robot.on('hello', () => {
  robot.send('hello')
})
