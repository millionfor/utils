// write JSON file
import writeJSON, { sync, syncTry } from './writeJSON'

import { writeText } from './write'

import { rmDirFile } from './rm'

export default {
  writeJSON: {
    default: writeJSON,
    sync,
    syncTry
  },
  rmDirFile,
  writeText
}
