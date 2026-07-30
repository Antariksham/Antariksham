'use server'

import { v2 as cloudinary } from 'cloudinary'
import { getAdminUser } from '@/modules/admin/services/getAdminUser'
import { supabaseAdmin } from '@/lib/supabase'
import { slugify, titleFromFilename } from '@/modules/admin/media/mediaNaming'

// Configured lazily inside each action so a missing env var never throws at
// module load / build time. cloud_name + api_key are public (the upload widget
// needs them client-side too); only the secret is server-only.
function cld() {
  cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure:     true,
  })
  return cloudinary
}

// Signs a SIGNED CldUploadWidget upload. Called from the thin route handler at
// /api/admin/cloudinary/sign (the widget's signatureEndpoint needs a URL).
export async function signCloudinaryUpload(paramsToSign: Record<string, string>) {
  if (!(await getAdminUser())) return { error: 'Unauthorized' as const }
  if (!process.env.CLOUDINARY_API_SECRET) return { error: 'Cloudinary is not configured' as const }
  const signature = cld().utils.api_sign_request(paramsToSign, process.env.CLOUDINARY_API_SECRET)
  return { signature }
}

// Persist a successful widget upload into media_assets.
export async function recordCloudinaryUpload(info: {
  public_id: string
  secure_url: string
  bytes: number
  format?: string
  width?: number
  height?: number
  original_filename?: string
}) {
  const admin = await getAdminUser()
  if (!admin) return { error: 'Unauthorized' as const }

  // Columns map onto the existing media_assets schema:
  //   file_url <- secure_url, file_type <- mime, file_size <- bytes, title <- name
  // Title/slug go through the same derivation as the Supabase path so both
  // providers land in the search index looking the same.
  const title = titleFromFilename(info.original_filename || info.public_id)

  const { data, error } = await supabaseAdmin()
    .from('media_assets')
    .insert({
      provider:    'cloudinary',
      storage_key: info.public_id,
      file_url:    info.secure_url,
      title,
      slug:        slugify(title),
      file_type:   info.format ? `image/${info.format}` : null,
      file_size:   info.bytes,
      width:       info.width ?? null,
      height:      info.height ?? null,
      folder:      'cloudinary',
      uploaded_by: admin.id,
    })
    .select('id')
    .single()

  if (error) {
    console.error('recordCloudinaryUpload error:', error)
    return { error: 'Failed to record upload' as const }
  }
  return { id: data.id as string }
}

// Listing lives in GET /api/admin/media, which searches and paginates the
// media_assets index for both providers. The 200-row cap that used to live here
// is gone with it.

export async function deleteCloudinaryMedia(id: string) {
  if (!(await getAdminUser())) return { error: 'Unauthorized' as const }

  const db = supabaseAdmin()
  const { data: row } = await db
    .from('media_assets')
    .select('storage_key')
    .eq('id', id)
    .eq('provider', 'cloudinary')
    .single()

  if (!row) return { error: 'Not found' as const }

  try {
    await cld().uploader.destroy(row.storage_key, { invalidate: true })
  } catch (err) {
    console.error('cloudinary destroy error:', err)
    return { error: 'Failed to delete from Cloudinary' as const }
  }

  const { error } = await db.from('media_assets').delete().eq('id', id)
  if (error) {
    console.error('deleteCloudinaryMedia db error:', error)
    return { error: 'Removed from Cloudinary but the record remained' as const }
  }
  return { success: true as const }
}
