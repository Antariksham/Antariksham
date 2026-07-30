'use client'

import { CldUploadWidget } from 'next-cloudinary'
import { recordCloudinaryUpload } from '@/actions/cloudinary-media'

// Signed upload widget. next-cloudinary POSTs the params to sign to our
// /api/admin/cloudinary/sign route (which authorizes via getAdminUser). On each
// successful upload we persist the asset into media_assets.
//
// The widget is a third-party iframe that hands the file over only once it has
// landed, so there is nowhere to ask for a title beforehand the way the Supabase
// dialog does. Instead every created asset is reported to the parent via
// `onUploaded`, which opens the metadata dialog once the widget closes — the
// Cloudinary tab ends up in the same place rather than leaving assets titled
// after the phone's filename.
export function CloudinaryButton({
  onDone, onUploaded,
}: {
  onDone: () => void
  onUploaded?: (asset: { id: string; url: string; title: string | null }) => void
}) {
  return (
    <CldUploadWidget
      signatureEndpoint="/api/admin/cloudinary/sign"
      options={{
        folder:               'cosmos',
        sources:              ['local', 'url'],
        multiple:             true,
        maxFiles:             10,
        clientAllowedFormats: ['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif', 'tiff'],
        maxFileSize:          20_000_000, // 20 MB — Cloudinary is the display tier
      }}
      onSuccess={async (result: any) => {
        const info = result?.info
        if (!info || typeof info === 'string') return
        const recorded = await recordCloudinaryUpload({
          public_id:         info.public_id,
          secure_url:        info.secure_url,
          bytes:             info.bytes,
          format:            info.format,
          width:             info.width,
          height:            info.height,
          original_filename: info.original_filename,
        })
        const assetId = 'id' in recorded ? recorded.id : undefined
        if (assetId) {
          onUploaded?.({
            id:    assetId,
            url:   info.secure_url,
            title: info.original_filename ?? null,
          })
        }
        onDone()
      }}
    >
      {({ open }) => (
        <button
          type="button"
          onClick={() => open?.()}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '7px',
            padding: '9px 16px', borderRadius: '7px', border: 'none',
            background: 'var(--accent)', color: 'var(--black)',
            fontFamily: 'var(--font-mono)', fontSize: '14px',
            letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          ↑ Upload to Cloudinary
        </button>
      )}
    </CldUploadWidget>
  )
}
