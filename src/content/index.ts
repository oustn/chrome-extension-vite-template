import { greeting } from '../common'
import _, { isArray } from 'lodash'

greeting('content')

console.log(_, isArray)

const injectScript = (file: string, node: string) => {
  const th = document.querySelector(node)
  const s = document.createElement('script')
  s.setAttribute('type', 'text/javascript')
  s.setAttribute('src', file)
  s.setAttribute('type', 'module')
  th?.appendChild(s)
}
injectScript(getAssetURL('src/injects/index.ts'), 'body')
