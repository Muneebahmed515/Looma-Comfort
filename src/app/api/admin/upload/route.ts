import type { NextRequest } from 'next/server'
import { adminForAction } from '@/lib/admin/auth'
import { BUCKETS, MAX_UPLOAD_BYTES, UPLOAD_TYPES, hasMediaStore, putMedia } from '@/lib/media'

const PATH = new RegExp(`^(${BUCKETS.join('|')})/[A-Za-z0-9_-]{1,64}(/[A-Za-z0-9_-]{1,64}){0,2}/[A-Za-z0-9-]{1,40}-(480|960|1600)\\.(webp|jpg|png|avif)$`)

/**
 * Admin image upload: receives one pre-sized image (the browser compresses each photo into
 * 480/960/1600 px versions) and stores it in Vercel Blob at the given path.
 */
export async function POST(request: NextRequest) {
  const auth = await adminForAction()
  if ('error' in auth) return Response.json({ ok: false, message: auth.error.message }, { status: 401 })
  if (!hasMediaStore) {
    return Response.json({ ok: false, message: 'Image storage is not connected. Add a Vercel Blob store (see README).' }, { status: 503 })
  }
  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return Response.json({ ok: false, message: 'Upload failed. Please try again.' }, { status: 400 })
  }
  const path = String(form.get('path') ?? '')
  const file = form.get('file')
  if (!PATH.test(path)) return Response.json({ ok: false, message: 'Invalid upload path.' }, { status: 400 })
  if (!(file instanceof Blob)) return Response.json({ ok: false, message: 'No file received.' }, { status: 400 })
  const ext = UPLOAD_TYPES[file.type]
  if (!ext || !path.endsWith(`.${ext}`)) return Response.json({ ok: false, message: 'Only WebP, JPEG, PNG or AVIF images can be uploaded.' }, { status: 400 })
  if (file.size > MAX_UPLOAD_BYTES) return Response.json({ ok: false, message: 'This image is too large after compression.' }, { status: 413 })
  try {
    const url = await putMedia(path, file, file.type)
    return Response.json({ ok: true, url })
  } catch (e) {
    const message = e instanceof Error && /already exists/i.test(e.message) ? 'An image with this name already exists. Please try again.' : 'Upload failed. Please try again.'
    return Response.json({ ok: false, message }, { status: 500 })
  }
}
