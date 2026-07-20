import { NextResponse } from 'next/server'
import { signCloudinaryUpload } from '@/actions/cloudinary-media'

// Thin wrapper so <CldUploadWidget signatureEndpoint="/api/admin/cloudinary/sign">
// can sign SIGNED uploads. next-cloudinary POSTs { paramsToSign } and expects
// { signature }. Auth is enforced inside signCloudinaryUpload (getAdminUser).
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const paramsToSign = body?.paramsToSign ?? {}

  const result = await signCloudinaryUpload(paramsToSign)
  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: 401 })
  }
  return NextResponse.json({ signature: result.signature })
}
