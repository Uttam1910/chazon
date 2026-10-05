import { api } from '../api'

export type MediaItem = { id: string; filename: string; originalName: string; mimeType: string; size: number; width: number | null; height: number | null; alt: string; url: string; createdAt: string; uploadedBy?: { name: string } | null }

export const ACCEPT = 'image/jpeg,image/png,image/webp,image/avif,image/gif'
export function uploadImage(file: File, alt = '') {
  const form = new FormData()
  form.append('file', file)
  form.append('alt', alt)
  return api.post<MediaItem>('/media', form)
}
