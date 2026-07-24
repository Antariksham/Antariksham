/**
 * Shared loading spinner. Theme-aware (track uses --ink, the moving arc uses
 * currentColor so it inherits the surrounding text/button color) and driven by
 * the global `@keyframes spin` in styles/globals.css.
 *
 * Use inside buttons for a consistent "your click is working" state, e.g.:
 *   <button disabled={saving}>{saving ? <><Spinner size={13}/> Saving…</> : 'Save'}</button>
 */
export function Spinner({
  size = 14,
  className,
  style,
}: {
  size?: number
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <span
      className={className}
      role="status"
      aria-label="Loading"
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        border: '2px solid rgba(var(--ink), 0.3)',
        borderTopColor: 'currentColor',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
        flexShrink: 0,
        ...style,
      }}
    />
  )
}
