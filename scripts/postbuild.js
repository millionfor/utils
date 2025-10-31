#!/usr/bin/env node

/**
 * Post-build script to fix type definition file paths
 * Copies dist/src/index.d.ts to dist/index.d.ts and updates import paths
 */

const fs = require('fs');
const path = require('path');

const distSrcIndexPath = path.join(__dirname, '../dist/src/index.d.ts');
const distIndexPath = path.join(__dirname, '../dist/index.d.ts');

// Check if dist/src/index.d.ts exists
if (!fs.existsSync(distSrcIndexPath)) {
  console.warn('Warning: dist/src/index.d.ts does not exist. Skipping postbuild step.');
  process.exit(0);
}

// Read the source file
let content = fs.readFileSync(distSrcIndexPath, 'utf8');

// Update the paths to include ./src prefix
content = content
  .replace(/from '\.\/common'/g, "from './src/common'")
  .replace(/from "\.\/common"/g, 'from "./src/common"')
  .replace(/from '\.\/node'/g, "from './src/node'")
  .replace(/from "\.\/node"/g, 'from "./src/node"')
  .replace(/from '\.\/types'/g, "from './src/types'")
  .replace(/from "\.\/types"/g, 'from "./src/types"');

// Write to dist/index.d.ts
fs.writeFileSync(distIndexPath, content, 'utf8');

console.log('✓ Post-build: Type definitions copied and paths updated');

