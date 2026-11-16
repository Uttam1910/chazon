// Bundles the API (and workspace packages like @chazon/shared) into dist/; all external npm packages stay external.
import { build } from 'esbuild'
import { readFile } from 'node:fs/promises'

const pkg = JSON.parse(await readFile(new URL('./package.json', import.meta.url), 'utf8'))
const externalDeps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })
  .filter(name => !name.startsWith('@chazon/'))

await build({
  entryPoints: ['src/index.ts', 'src/app.ts'],
  outdir: 'dist',
  outbase: 'src',
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  sourcemap: true,
  external: [
    ...externalDeps,
    ...externalDeps.map(name => `${name}/*`),
    'pg',
    'pg/*',
    '@prisma/*',
    'express',
    'express/*',
  ],
  banner: {
    js: "import { createRequire as __createRequire } from 'node:module'; const require = __createRequire(import.meta.url);",
  },
  logLevel: 'info',
})
