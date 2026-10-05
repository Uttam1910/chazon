import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'prisma/config'

// Secrets live in the repository-root .env (see .env.example).
const rootEnv = fileURLToPath(new URL('../../.env', import.meta.url))
if (existsSync(rootEnv)) process.loadEnvFile(rootEnv)

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations', seed: 'tsx prisma/seed.ts' },
  // Migrations use the direct (non-pooled) connection when one is provided.
  datasource: { url: process.env.DIRECT_URL || process.env.DATABASE_URL || '' },
})
