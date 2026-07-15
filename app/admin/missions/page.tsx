import Link                   from 'next/link'
import { getAdminMissions }   from '@/modules/admin/services/adminMissions'
import { formatDate }         from '@/lib/utils'
import { Plus, Rocket, Star, CheckCircle, Clock, AlertCircle, XCircle } from 'lucide-react'
import { MissionRowActions }  from '@/modules/admin/components/MissionRowActions'

export const revalidate = 0

const STATUS_TABS = [
  { value: 'all',            label: 'All'            },
  { value: 'active',         label: 'Active'         },
  { value: 'upcoming',       label: 'Upcoming'       },
  { value: 'in-development', label: 'In Development' },
  { value: 'completed',      label: 'Completed'      },
] as const

const STATUS_STYLES: Record<string, { color: string; icon: React.ReactNode }> = {
  active:           { color: 'var(--green)',  icon: <CheckCircle size={10} /> },
  upcoming:         { color: 'var(--accent)', icon: <Clock       size={10} /> },
  'in-development': { color: 'var(--gold)',   icon: <AlertCircle size={10} /> },
  completed:        { color: 'rgba(var(--ink),0.78)', icon: <CheckCircle size={10} /> },
  failed:           { color: 'var(--red)',    icon: <XCircle     size={10} /> },
  cancelled:        { color: 'var(--red)',    icon: <XCircle     size={10} /> },
}

export default async function AdminMissionsPage({
  searchParams,
}: {
  searchParams: { status?: string; page?: string; q?: string }
}) {
  const status = (searchParams.status || 'all') as any
  const page   = parseInt(searchParams.page || '1', 10)
  const search = searchParams.q || ''

  const { rows, total, totalPages } = await getAdminMissions({
    page, perPage: 20, status, search: search || undefined,
  })

  return (
    <div style={{ maxWidth: '960px' }}>

      {/* ── Page header ─────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '32px', paddingBottom: '24px', borderBottom: '1px solid var(--border)' }}>
        <div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--accent)', display: 'block', marginBottom: '8px' }}>
            Content
          </span>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '30px', fontWeight: 300, color: 'var(--white)', margin: 0 }}>
            Missions
          </h1>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'rgba(var(--ink),0.82)', margin: '4px 0 0', letterSpacing: '0.06em' }}>
            {total} mission{total !== 1 ? 's' : ''} total
          </p>
        </div>

        <Link
          href="/admin/missions/new"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '10px 18px', borderRadius: '6px',
            background: 'var(--accent)', color: 'var(--black)',
            fontFamily: 'var(--font-mono)', fontSize: '12px',
            letterSpacing: '0.1em', textTransform: 'uppercase',
            fontWeight: 700, textDecoration: 'none', flexShrink: 0,
          }}
        >
          <Plus size={13} />
          New Mission
        </Link>
      </div>

      {/* ── Tabs + search ───────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '2px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '7px', padding: '3px' }}>
          {STATUS_TABS.map(tab => {
            const active = status === tab.value
            return (
              <Link
                key={tab.value}
                href={`/admin/missions?status=${tab.value}${search ? `&q=${encodeURIComponent(search)}` : ''}`}
                style={{
                  padding: '6px 12px', borderRadius: '5px',
                  fontFamily: 'var(--font-mono)', fontSize: '11px',
                  letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'none',
                  background: active ? 'var(--accent)' : 'transparent',
                  color:      active ? 'var(--black)'       : 'rgba(var(--ink),0.72)',
                  fontWeight: active ? 700              : 400,
                  transition: 'all 0.15s',
                }}
              >
                {tab.label}
              </Link>
            )
          })}
        </div>

        <form action="/admin/missions" method="GET" style={{ display: 'flex', gap: '6px' }}>
          <input type="hidden" name="status" value={status} />
          <input
            name="q"
            defaultValue={search}
            placeholder="Search missions…"
            style={{
              padding: '7px 12px', background: 'var(--surface)',
              border: '1px solid var(--border)', borderRadius: '6px',
              color: 'var(--white)', fontFamily: 'var(--font-mono)',
              fontSize: '12px', letterSpacing: '0.04em', outline: 'none', width: '200px',
            }}
          />
          <button type="submit" style={{ padding: '7px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px', color: 'rgba(var(--ink),0.9)', fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer' }}>
            Search
          </button>
        </form>
      </div>

      {/* ── Table ───────────────────────────────── */}
      {rows.length === 0 ? (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '60px', textAlign: 'center' }}>
          <Rocket size={32} style={{ color: 'rgba(var(--ink),0.72)', marginBottom: '12px' }} />
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'rgba(var(--ink),0.78)', letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0 0 16px' }}>
            {search ? 'No missions match your search' : 'No missions yet'}
          </p>
          <Link href="/admin/missions/new" style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--accent)', textDecoration: 'none', letterSpacing: '0.08em' }}>
            Add your first mission →
          </Link>
        </div>
      ) : (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
          {/* Head */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 110px 100px 80px', padding: '10px 20px', borderBottom: '1px solid var(--border)', background: 'rgba(var(--ink),0.02)' }}>
            {['Mission', 'Type', 'Status', 'Launch', 'Actions'].map(h => (
              <span key={h} style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(var(--ink),0.78)' }}>{h}</span>
            ))}
          </div>

          {/* Rows */}
          {rows.map((m, i) => {
            const ss = STATUS_STYLES[m.status] || STATUS_STYLES.upcoming
            return (
              <div
                key={m.id}
                style={{
                  display: 'grid', gridTemplateColumns: '1fr 90px 110px 100px 80px',
                  padding: '14px 20px', alignItems: 'center',
                  borderBottom: i < rows.length - 1 ? '1px solid var(--border)' : 'none',
                }}
              >
                {/* Name + meta */}
                <div style={{ minWidth: 0, paddingRight: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '3px' }}>
                    {m.featured && <Star size={10} style={{ color: 'var(--gold)', flexShrink: 0 }} />}
                    <p style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--white)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {m.name}
                    </p>
                  </div>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'rgba(var(--ink),0.78)', margin: 0, letterSpacing: '0.04em' }}>
                    {m.agencyName && <span style={{ marginRight: '8px', color: 'var(--accent)' }}>{m.agencyName}</span>}
                    {m.destination && <span>→ {m.destination}</span>}
                  </p>
                </div>

                {/* Type */}
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(var(--ink),0.82)' }}>
                  {m.missionType.replace('-', ' ')}
                </span>

                {/* Status */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ color: ss.color }}>{ss.icon}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: ss.color }}>
                    {m.status.replace('-', ' ')}
                  </span>
                </div>

                {/* Launch date */}
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'rgba(var(--ink),0.82)' }}>
                  {m.launchDate ? formatDate(m.launchDate) : '—'}
                </span>

                {/* Actions */}
                <MissionRowActions id={m.id} />
              </div>
            )
          })}
        </div>
      )}

      {/* ── Pagination ──────────────────────────── */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '24px' }}>
          {page > 1 && (
            <Link href={`/admin/missions?status=${status}&page=${page - 1}${search ? `&q=${encodeURIComponent(search)}` : ''}`}
              style={{ padding: '6px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '5px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'rgba(var(--ink),0.82)', textDecoration: 'none' }}>
              ← Prev
            </Link>
          )}
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'rgba(var(--ink),0.78)', padding: '0 8px' }}>
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Link href={`/admin/missions?status=${status}&page=${page + 1}${search ? `&q=${encodeURIComponent(search)}` : ''}`}
              style={{ padding: '6px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '5px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'rgba(var(--ink),0.82)', textDecoration: 'none' }}>
              Next →
            </Link>
          )}
        </div>
      )}

    </div>
  )
}
