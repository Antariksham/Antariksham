import Link               from 'next/link'
import { getAdminStats } from '@/modules/admin/services/getAdminStats'
import { formatDate }    from '@/lib/utils'
import {
  FileText, Rocket, Eye, Star,
  PenSquare, Plus, CheckCircle, Clock,
} from 'lucide-react'

export const revalidate = 60

export default async function AdminDashboard() {
  const stats = await getAdminStats()

  return (
    <div style={{ maxWidth: '900px' }}>

      {/* Page header */}
      <div style={{ marginBottom: '40px', paddingBottom: '28px', borderBottom: '1px solid var(--border)' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--accent)', display: 'block', marginBottom: '10px' }}>
          Antariksham.org
        </span>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '36px', fontWeight: 300, color: 'var(--white)', margin: '0 0 6px', letterSpacing: '-0.01em' }}>
          Mission Control
        </h1>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'rgba(var(--ink),0.82)', letterSpacing: '0.06em', margin: 0 }}>
          Content & Platform Dashboard
        </p>
      </div>

      {/* ── Stat cards ─────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px', marginBottom: '40px' }}>
        <StatCard icon={<FileText size={14} />}    label="Total Articles"  value={stats.totalArticles}     color="var(--accent)" />
        <StatCard icon={<CheckCircle size={14} />} label="Published"       value={stats.publishedArticles} color="var(--green)"  />
        <StatCard icon={<Clock size={14} />}       label="Drafts"          value={stats.draftArticles}     color="var(--gold)"   />
        <StatCard icon={<Star size={14} />}        label="Featured"        value={stats.featuredArticles}  color="var(--purple)" />
        <StatCard icon={<Rocket size={14} />}      label="Total Missions"  value={stats.totalMissions}     color="var(--accent)" />
        <StatCard icon={<Rocket size={14} />}      label="Active Missions" value={stats.activeMissions}    color="var(--green)"  />
      </div>

      {/* ── Quick actions ───────────────────────── */}
      <div style={{ marginBottom: '40px' }}>
        <SectionLabel>Quick Actions</SectionLabel>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <ActionBtn href="/admin/articles/new" primary icon={<Plus size={12} />}>New Article</ActionBtn>
          <ActionBtn href="/admin/articles"     icon={<FileText size={12} />}>Articles</ActionBtn>
          <ActionBtn href="/admin/missions"     icon={<Rocket size={12} />}>Missions</ActionBtn>
          <ActionBtn href="/admin/homepage"     icon={<PenSquare size={12} />}>Homepage</ActionBtn>
        </div>
      </div>

      {/* ── Recent articles ─────────────────────── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <SectionLabel>Recent Articles</SectionLabel>
          <Link href="/admin/articles" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--accent)', textDecoration: 'none' }}>
            View all →
          </Link>
        </div>

        {stats.recentArticles.length === 0 ? (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '40px', textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'rgba(var(--ink),0.85)', letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0 0 12px' }}>
              No articles yet
            </p>
            <Link href="/admin/articles/new" style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--accent)', textDecoration: 'none' }}>
              Create your first article →
            </Link>
          </div>
        ) : (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
            {stats.recentArticles.map((article, i) => (
              <div
                key={article.id}
                style={{
                  display:      'flex',
                  alignItems:   'center',
                  gap:          '14px',
                  padding:      '14px 20px',
                  borderBottom: i < stats.recentArticles.length - 1 ? '1px solid var(--border)' : 'none',
                }}
              >
                {/* Status dot */}
                <div style={{
                  width:        '6px',
                  height:       '6px',
                  borderRadius: '50%',
                  flexShrink:   0,
                  background:   article.status === 'published' ? 'var(--green)' : 'var(--gold)',
                  boxShadow:    article.status === 'published' ? '0 0 6px var(--green)' : 'none',
                }} />

                {/* Title + meta */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', fontWeight: 400, color: 'var(--white)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {article.title}
                  </p>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'rgba(var(--ink),0.78)', margin: '3px 0 0', letterSpacing: '0.05em' }}>
                    {article.status === 'published' && article.publishedAt
                      ? `Published ${formatDate(article.publishedAt)}`
                      : 'Draft — unpublished'}
                  </p>
                </div>

                {/* Views */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'rgba(var(--ink),0.78)', flexShrink: 0 }}>
                  <Eye size={11} />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                    {article.views.toLocaleString()}
                  </span>
                </div>

                {/* Edit */}
                <Link
                  href={`/admin/articles/${article.id}`}
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--accent)', textDecoration: 'none', flexShrink: 0, padding: '4px 10px', border: '1px solid rgba(79,142,247,0.3)', borderRadius: '4px' }}
                >
                  Edit
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────

function StatCard({ icon, label, value, color }: {
  icon: React.ReactNode; label: string; value: number; color: string
}) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '14px' }}>
        <span style={{ color: 'rgba(var(--ink),0.82)' }}>{icon}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(var(--ink),0.82)' }}>
          {label}
        </span>
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '30px', color, fontWeight: 300, lineHeight: 1 }}>
        {value}
      </div>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(var(--ink),0.82)', margin: '0 0 12px' }}>
      {children}
    </p>
  )
}

function ActionBtn({ href, icon, children, primary }: {
  href: string; icon: React.ReactNode; children: React.ReactNode; primary?: boolean
}) {
  return (
    <Link
      href={href}
      style={{
        display:        'inline-flex',
        alignItems:     'center',
        gap:            '6px',
        padding:        '9px 16px',
        borderRadius:   '6px',
        fontFamily:     'var(--font-mono)',
        fontSize: '12px',
        letterSpacing:  '0.1em',
        textTransform:  'uppercase',
        textDecoration: 'none',
        background:     primary ? 'var(--accent)' : 'var(--surface)',
        color:          primary ? 'var(--black)'        : 'rgba(var(--ink),0.8)',
        border:         primary ? 'none'           : '1px solid var(--border-hi)',
        fontWeight:     primary ? 700              : 400,
      }}
    >
      {icon}
      {children}
    </Link>
  )
}
