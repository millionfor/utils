/**
 * @FileName        writeJSON
 * @CreatedTime     三,  7 24, 2024 15:26
 * @LastModified    三,  7 24, 2024 15:26
 * @Author          QuanQuan <millionfor@apache.org>
 * @Description     writeJSON
 */

import * as fs from 'fs'
import { writeFile } from 'fs/promises'
import tryCatch from 'try-catch'

/**
 * WriteOptions.
 */
type WriteOptions = {
  encoding?: BufferEncoding
  mode?: number
  flag?: string
  space?: number
  eof?: boolean
  replacer?: (key: string, value: any) => any
}

/**
 * getWriteOptions.
 *
 * @param options -
 */
const getWriteOptions = (options: WriteOptions) => ({
  encoding: options.encoding,
  mode: options.mode,
  flag: options.flag,
})

/**
 * writeJSON.
 *
 * @param name -
 * @param json -
 * @param options -
 */
async function writeJSON(name: string, json: object, options: WriteOptions = {}) {
  check(name, json, options)

  const str = stringify(json, options)
  const writeOptions = getWriteOptions(options)

  await writeFile(name, str, writeOptions)
}

/**
 * sync.
 *
 * @param name -
 * @param data -
 * @param options -
 */
function sync(name: string, data: object, options: WriteOptions = {}) {
  check(name, data, options)

  const writeOptions = getWriteOptions(options)
  fs.writeFileSync(name, stringify(data, options), writeOptions)
}

/**
 * syncTry.
 *
 * @param name -
 * @param data -
 * @param options -
 */
function syncTry(name: string, data: object, options: WriteOptions = {}) {
  check(name, data, options)

  const [error] = tryCatch(sync, name, data, options)

  return error
}

/**
 * defaultOptions.
 *
 * @param options -
 */
function defaultOptions(options: WriteOptions) {
  if (typeof options.space === 'undefined') options.space = 4
  if (typeof options.eof === 'undefined') options.eof = true
  return options
}

/**
 * stringify.
 *
 * @param data -
 * @param options -
 */
function stringify(data: object, options: WriteOptions) {
  defaultOptions(options)

  const result = JSON.stringify(data, options.replacer, options.space)
  const { eof } = options

  return maybeAddNewLine(result, { eof })
}

/**
 * maybeAddNewLine.
 *
 * @param str -
 * @param options -
 */
function maybeAddNewLine(str: string, options: { eof: boolean }) {
  if (!options.eof) return str

  return `${str}\n`
}

/**
 * check.
 *
 * @param name -
 * @param json -
 * @param options -
 */
function check(name: string, json: object, options: WriteOptions) {
  if (typeof name !== 'string') throw new Error('name should be string!')
  if (typeof json !== 'object') throw new Error('json should be object!')
  if (typeof options !== 'object') throw new Error('options should be object!')
}

export default writeJSON
export { sync, syncTry }

// Adding sync.try to the export
sync.try = syncTry
