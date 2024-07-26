/**
 * A Typescript based Node Development Tool Library.
 *
 * @author QuanQuan <millionfor@apache.org>
 * Released under the MIT License.
 */

// write JSON file
import writeJSON, { sync, syncTry } from './writeJSON'

import { writeText } from './write'

import { rmDirFile } from './rm'


export default {
  writeJSON: {
    default: writeJSON,
    sync, syncTry
  },
  rmDirFile,
  writeText
}

