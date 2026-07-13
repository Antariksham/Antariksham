'use client'

import Link        from 'next/link'
import { useRouter } from 'next/navigation'
import { useState }  from 'react'
import { Pencil, Trash2 } from 'lucide-react'

export function ArticleRowActions({ id, slug }: { id: string; slug: string }) {
  const router     = useRouter()
  const [busy, setBusy] = useState(false)

  async function handleDelete() {
    if (!confirm('Delete this article? This cannot be undone.')) return
    setBusy(true)
    try {
      const res = await fetch(`/api/admin/articles?id=${id}`, { method: 'DELETE' })
      if (res.ok) router.refresh()
      else        alert('Delete failed — please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
      <Link
        href={`/admin/articles/${id}`}
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: '28px', height: '28px', borderRadius: '5px',
          border: '1px solid var(--border)', color: 'rgba(var(--ink),0.5)',
          textDecoration: 'none', transition: 'all 0.15s',
        }}
        title="Edit"
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = 'var(--accent)'
          e.currentTarget.style.color = 'var(--accent)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = 'var(--border)'
          e.currentTarget.style.color = 'rgba(var(--ink),0.5)'
        }}
      >
        <Pencil size={11} />
      </Link>

      <button
        onClick={handleDelete}
        disabled={busy}
        title="Delete"
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: '28px', height: '28px', borderRadius: '5px',
          border: '1px solid var(--border)', background: 'transparent',
          color: 'rgba(var(--ink),0.35)', cursor: busy ? 'not-allowed' : 'pointer',
          transition: 'all 0.15s',
        }}
        onMouseEnter={e => {
          if (!busy) {
            e.currentTarget.style.borderColor = 'rgba(231,76,60,0.5)'
            e.currentTarget.style.color = 'var(--red)'
          }
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = 'var(--border)'
          e.currentTarget.style.color = 'rgba(var(--ink),0.35)'
        }}
      >
        <Trash2 size={11} />
      </button>
    </div>
  )
}
