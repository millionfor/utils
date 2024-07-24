// vim: set ft=javascript fdm=marker et ff=unix tw=80 sw=2:

import path from 'path'

const {
  name,
  version,
  license,
  author,
  dependencies,
  repository
} = require('./package.json')

const banner = (name, short = false) => {
  let s
  if (short) {
    s = `/*! ${name} v${version} | ${license} licensed | ${author} */`
  } else {
    s = `/**
 * ${name} v${version} - ${repository}
 *
 * @author ${author}
 * Released under the ${license} license.
 */`
  }
  return s
}

const plugins = [
  'resolve',
  'typescript',
  'babel'
]

export default {
  destDir: path.join(__dirname, './lib'),
  dependencies,
  entry: [
    {
      input: 'src/index.ts',
      plugins,
      output: [
        { format: 'umd', name: 'Utils', file: 'lib/utils.min.js', banner: banner(name) },
        { format: 'cjs', file: 'lib/utils.cjs.js', banner: banner(name) },
        { format: 'es', file: 'lib/utils.es.js', banner: banner(name) }
      ]
    }
  ]
}
