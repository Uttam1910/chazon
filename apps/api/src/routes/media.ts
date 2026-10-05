import { randomBytes } from 'node:crypto'
import { mkdir, unlink, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { Router } from 'express'
import multer from 'multer'
import sharp, { type OutputInfo } from 'sharp'
import { z } from 'zod'
import { prisma, type Prisma } from '../db'
import { ApiError, listQuery, notFound, ok, paged, parse } from '../lib/http'
import { uploadDir } from '../uploads'

// Basic image library. Uploads are decoded (which also verifies they are real images), auto-rotated,
// stripped of metadata, resized to at most 2400px and stored as WebP. SVG is not accepted (it can carry scripts).
export const mediaRouter = Router()

const MAX_BYTES = 10 * 1024 * 1024
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_BYTES, files: 1 } })
const ACCEPTED = new Set(['jpeg', 'png', 'webp', 'avif', 'gif', 'heif'])

mediaRouter.get('/', async (req, res) => {
  const { page, pageSize, q } = parse(listQuery.extend({ pageSize: z.coerce.number().int().min(1).max(100).default(30) }), req.query)
  const where: Prisma.MediaWhereInput = q ? { OR: [{ originalName: { contains: q, mode: 'insensitive' } }, { alt: { contains: q, mode: 'insensitive' } }] } : {}
  const [items, total] = await Promise.all([
    prisma.media.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize, include: { uploadedBy: { select: { name: true } } } }),
    prisma.media.count({ where }),
  ])
  paged(res, items, total, page, pageSize)
})

mediaRouter.post('/', (req, res, next) => upload.single('file')(req, res, err => {
  if (err instanceof multer.MulterError) return next(new ApiError(err.code === 'LIMIT_FILE_SIZE' ? 413 : 400, 'UPLOAD_ERROR', err.code === 'LIMIT_FILE_SIZE' ? 'Images must be 10 MB or smaller.' : 'Upload failed.'))
  next(err)
}), async (req, res) => {
  const file = req.file
  if (!file) throw new ApiError(422, 'VALIDATION_ERROR', 'Choose an image to upload.', { file: 'Choose an image' })
  const alt = z.string().trim().max(300).catch('').parse(req.body?.alt ?? '')
  let output: { data: Buffer; info: OutputInfo }
  try {
    const meta = await sharp(file.buffer).metadata()
    if (!meta.format || !ACCEPTED.has(meta.format)) throw new Error('unsupported')
    output = await sharp(file.buffer, { animated: meta.format === 'gif' }).rotate()
      .resize({ width: 2400, height: 2400, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 }).toBuffer({ resolveWithObject: true })
  } catch {
    throw new ApiError(422, 'VALIDATION_ERROR', 'That file is not a supported image (JPEG, PNG, WebP, AVIF or GIF).', { file: 'Unsupported image' })
  }
  const filename = `${Date.now().toString(36)}-${randomBytes(6).toString('hex')}.webp`
  await mkdir(uploadDir, { recursive: true })
  await writeFile(join(uploadDir, filename), output.data)
  const originalName = file.originalname.replace(/[^\w.\- ()]/g, '_').slice(0, 200) || 'image'
  const media = await prisma.media.create({
    data: { filename, originalName, mimeType: 'image/webp', size: output.info.size, width: output.info.width, height: output.info.pageHeight ?? output.info.height, alt, url: `/uploads/${filename}`, uploadedById: req.admin!.id },
  })
  ok(res, media, 201)
})

mediaRouter.patch('/:id', async (req, res) => {
  const { alt } = parse(z.object({ alt: z.string().trim().max(300) }), req.body)
  ok(res, await prisma.media.update({ where: { id: req.params.id }, data: { alt } }))
})

mediaRouter.delete('/:id', async (req, res) => {
  const media = await prisma.media.findUnique({ where: { id: req.params.id } })
  if (!media) throw notFound('Image')
  await prisma.media.delete({ where: { id: media.id } })
  await unlink(join(uploadDir, media.filename)).catch(() => {})
  ok(res, { deleted: true })
})
