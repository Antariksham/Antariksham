'use server'

import { v2 as cloudinary } from 'cloudinary'
import { getAdminUser } from '@/modules/admin/services/getAdminUser'
import { supabaseAdmin } from '@/lib/supabase'
import type { CloudinaryItem } from '@/modules/admin/media/types'

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

  const { data, error } = await supabaseAdmin()
    .from('media_assets')
    .insert({
      provider:    'cloudinary',
      storage_key: info.public_id,
      url:         info.secure_url,
      filename:    info.original_filename ? `${info.original_filename}.${info.format ?? ''}`.replace(/\.$/, '') : info.public_id,
      mime_type:   info.format ? `image/${info.format}` : null,
      size_bytes:  info.bytes,
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

export async function listCloudinaryMedia(): Promise<{ items: CloudinaryItem[]; error?: string }> {
  if (!(await getAdminUser())) return { items: [], error: 'Unauthorized' }

  const { data, error } = await supabaseAdmin()
    .from('media_assets')
    .select('id, url, storage_key, filename, size_bytes, width, height, created_at')
    .eq('provider', 'cloudinary')
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) {
    console.error('listCloudinaryMedia error:', error)
    return { items: [], error: 'Failed to list media' }
  }

  const items: CloudinaryItem[] = (data || []).map((r: any) => ({
    id:        r.id,
    url:       r.url,
    publicId:  r.storage_key,
    filename:  r.filename || r.storage_key,
    sizeBytes: r.size_bytes || 0,
    width:     r.width ?? null,
    height:    r.height ?? null,
    createdAt: r.created_at || '',
  }))
  return { items }
}

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
