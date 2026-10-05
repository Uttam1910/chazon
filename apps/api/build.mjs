// Bundles the API (and the workspace's @chazon/shared source) into dist/; npm dependencies stay external.
import { build } from 'esbuild'
import { readFile } from 'node:fs/promises'
const pkg = JSON.parse(await readFile(new URL('./package.json', import.meta.url), 'utf8'))
const external = Object.keys(pkg.dependencies).filter(name => !name.startsWith('@chazon/'))
await build({
  entryPoints: ['src/index.ts'],
  outfile: 'dist/index.js',
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  sourcemap: true,
  external: [...external, ...external.map(name => `${name}/*`)],
  logLevel: 'info',
})
