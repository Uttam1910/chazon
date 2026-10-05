import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { env } from './env'

/** Where uploaded media is written. Defaults to apps/api/uploads (git-ignored); use persistent storage in production. */
export const uploadDir = env.UPLOAD_DIR ? resolve(env.UPLOAD_DIR) : fileURLToPath(new URL('../uploads', import.meta.url))
