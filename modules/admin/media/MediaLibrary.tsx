'use client'

import { useState } from 'react'
import { SupabaseMediaPanel } from './SupabaseMediaPanel'
import { CloudinaryMediaPanel } from './CloudinaryMediaPanel'
import { CLOUDINARY_ENABLED, type ProviderKey, type SupabaseBucket } from './types'

// Thin shell: a provider tab bar over the active provider panel. The Supabase
// tab is always present (unchanged behaviour); the Cloudinary tab appears only
// when NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is set, so the admin panel is identical
// to before until the env is configured. Public props are unchanged, so the
// article/mission/author/learn forms keep working without edits.

interface Props {
  pickerMode?:     boolean
  onPick?:         (url: string) => void
  defaultBucket?:  SupabaseBucket
  defaultProvider?: ProviderKey
}

const PROVIDERS: { key: ProviderKey; label: string; enabled: boolean }[] = [
  { key: 'supabase',   label: 'Supabase Storage', enabled: true },
  { key: 'cloudinary', label: 'Cloudinary',       enabled: CLOUDINARY_ENABLED },
]

export function MediaLibrary({ pickerMode = false, onPick, defaultBucket, defaultProvider = 'supabase' }: Props) {
  const providers = PROVIDERS.filter(p => p.enabled)
  const [provider, setProvider] = useState<ProviderKey>(
    providers.some(p => p.key === defaultProvider) ? defaultProvider : 'supabase',
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {!pickerMode && (
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '6px' }}>
            Admin
          </div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', fontWeight: 400, color: 'var(--white)', margin: '0 0 4px' }}>
            Media Library
          </h1>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '15px', color: 'rgba(var(--ink),0.82)', margin: 0 }}>
            Upload and manage images across your storage providers
          </p>
        </div>
      )}

      {/* Provider tabs — only shown when more than one provider is available */}
      {providers.length > 1 && (
        <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid var(--border)' }}>
          {providers.map(p => {
            const active = provider === p.key
            return (
              <button
                key={p.key}
                onClick={() => setProvider(p.key)}
                style={{
                  padding: '9px 18px', background: 'transparent', border: 'none',
                  borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent',
                  color: active ? 'var(--accent)' : 'rgba(var(--ink),0.6)',
                  fontFamily: 'var(--font-mono)', fontSize: '14px',
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                  cursor: 'pointer', marginBottom: '-1px', transition: 'all 0.15s',
                }}
              >
                {p.label}
              </button>
            )
          })}
        </div>
      )}

      {provider === 'cloudinary' && CLOUDINARY_ENABLED ? (
        <CloudinaryMediaPanel pickerMode={pickerMode} onPick={onPick} />
      ) : (
        <SupabaseMediaPanel pickerMode={pickerMode} onPick={onPick} defaultBucket={defaultBucket} />
      )}
    </div>
  )
}
