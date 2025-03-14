import { ModuleInfo } from 'rollup'
import { ConfigEnv, Plugin, UserConfig } from 'vite'
import { WebSocket, WebSocketServer } from 'ws'
import { load } from 'cheerio'
import { resolveEntries } from '../entries.ts'

const entries = resolveEntries()

export function createHmr(): Plugin {
  let wss: WebSocketServer | null
  let ws: WebSocket | null
  let timer: NodeJS.Timeout

  let changed: Set<string> = new Set()

  const send = () => {
    if (!wss) return
    const ids = Array.from(changed)
    changed = new Set()
    let reload = false
    let update = false
    ids.forEach((id) => {
      const entry = entries.find((d) => d.file === id)
      if (entry) {
        update = true
        if (!entry.value.endsWith('html')) {
          reload = true
        }
      }
    })
    if (!update) return

    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: reload ? 'reload' : 'refresh' }))
      }
    })
  }

  const close = () => {
    ws?.close()
    wss?.close()
    clearTimeout(timer)
    ws = null
    wss = null
  }

  function getRootDependencies(
    id: string,
    getModuleInfo: (id: string) => ModuleInfo | null,
    visited: Set<string> = new Set(),
  ): string[] {
    if (visited.has(id)) return []
    visited.add(id)

    const info = getModuleInfo(id)
    if (!info || info.importers.length === 0) {
      return [id] // 这是一个根模块
    }

    // 递归查找所有依赖的根模块
    return info.importers.flatMap((dep) =>
      getRootDependencies(dep, getModuleInfo, visited),
    )
  }

  return {
    name: 'vite-plugin-hmr',

    apply(config: UserConfig, { command }: ConfigEnv) {
      // 我们只在 build 且 watch 的情况下使用插件
      const canUse = command === 'build' && Boolean(config?.build?.watch)
      if (canUse) {
        wss = new WebSocketServer({ port: 2333 })
        console.log('[HMR] WebSocket server started on ws://localhost:2333')
      }
      return canUse
    },

    transform(code, id) {
      const entry = entries.find((d) => d.file === id)
      if (entry) {
        if (/\.(js|ts|jsx|tsx)$/.test(id)) {
          // 检查是否已经有某个 import，如果没有，就自动加上
          if (!code.includes('@/common/hmr.ts')) {
            code = `import "@/common/hmr.ts";\n${code}`
          }
        } else if (id.endsWith('.html') && !code.includes('@/common/hmr.ts')) {
          const $ = load(code)
          $('head').append(
            `<script type="module" src="@/common/hmr.ts"></script>`,
          )
          return $.html()
        }
      }
      return code
    },

    closeBundle() {
      timer = setTimeout(send, 500)
    },
    watchChange(id) {
      const ids = getRootDependencies(id, this.getModuleInfo.bind(this))
      ids.forEach((d) => changed.add(d))
      clearTimeout(timer)
    },
    closeWatcher() {
      close()
    },
  }
}
