'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'

export function LearnRowActions({ id }: { id: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function handleDelete() {
    if (!confirm('Delete this topic? This cannot be undone.')) return
    setBusy(true)
    try {
      const res = await fetch(`/api/admin/learn?id=${id}`, { method: 'DELETE' })
      if (res.ok) router.refresh()
      else        alert('Delete failed — please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
      <Link href={`/admin/learn/${id}`} title="Edit" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '5px', border: '1px solid var(--border)', color: 'rgba(var(--ink),0.5)', textDecoration: 'none' }}>
        <Pencil size={11} />
      </Link>
      <button onClick={handleDelete} disabled={busy} title="Delete" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '5px', border: '1px solid var(--border)', background: 'transparent', color: 'rgba(var(--ink),0.35)', cursor: busy ? 'not-allowed' : 'pointer' }}>
        <Trash2 size={11} />
      </button>
    </div>
  )
}
