import { readFileSync } from 'fs-extra'
import path from 'path'

const pkginfo = JSON.parse(readFileSync(path.join(__dirname, '..', '..', 'package.json')).toString())

export { pkginfo }
