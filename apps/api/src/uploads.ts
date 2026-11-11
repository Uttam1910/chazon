import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { env } from './env'

/**
 * Where uploaded media is written. Defaults to apps/api/uploads locally,
 * or /tmp/chazon-uploads on read-only Vercel serverless filesystems unless UPLOAD_DIR is set.
 */
export const uploadDir = env.UPLOAD_DIR
  ? resolve(env.UPLOAD_DIR)
  : process.env.VERCEL
    ? join(tmpdir(), 'chazon-uploads')
    : fileURLToPath(new URL('../uploads', import.meta.url))
