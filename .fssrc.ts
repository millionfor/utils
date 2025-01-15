// .fssrc.ts
// by @milliofnor

import progressPlugin from 'rollup-plugin-progress'

// import { BundlerOptions, Plugin } from './typings/types'

import { name, version, license, author, description, repository } from './package.json'

const banner = (name, short = false) => {
  let s
  if (short) {
    s = `/*! ${name} v${version} | ${license} licensed | ${author} */`
  } else {
    s = `/**
 * ${name} v${version} - ${repository.url}
 *
 * @author ${author}
 * Released under the ${license} license.
 */`
  }
  return s
}

const progress = () => {
  if (process.env.TRAVIS || process.env.NETLIFY) {
    return {}
  }
  return progressPlugin()
}

const spec = {
  destDir: './dist',
  dependencies: ['utils', 'objects', 'arrays', 'events', 'util', 'assert', 'process', 'url', 'child_process'],
  entry: [
    {
      input: 'src/index.ts',
      plugins: ['resolve', 'typescript', progress(), ['minimize', { output: { beautify: false } }]],
      output: [
        {
          format: 'umd',
          name: 'Utils',
          file: 'dist/index.min.js',
          get banner() {
            return banner(name)
          }
        },
        {
          format: 'cjs',
          file: 'dist/index.cjs.js',
          get banner() {
            return banner(name)
          }
        },
        {
          format: 'esm',
          file: 'dist/index.esm.js',
          get banner() {
            return banner(name)
          }
        }
      ]
    }
  ]
}

export default spec
