import _, {isArray} from 'lodash'
import { greeting } from "../common"
import svg from '../assets/vite.svg?no-inline'

greeting('inject')

console.log(svg)

console.log(_, isArray)
