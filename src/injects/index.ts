import { Renderer } from '@/components'
import { App } from './App'

const div = document.createElement('div')
document.body.appendChild(div)

Renderer(App, div)
