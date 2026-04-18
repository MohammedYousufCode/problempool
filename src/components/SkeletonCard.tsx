export default function SkeletonCard() {
  return (
    <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div className="skeleton" style={{ height: '1.25rem', width: '70%' }} />
      <div style={{ display: 'flex', gap: '0.375rem' }}>
        <div className="skeleton" style={{ height: '1.25rem', width: '5rem', borderRadius: '9999px' }} />
        <div className="skeleton" style={{ height: '1.25rem', width: '4rem', borderRadius: '9999px' }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
        <div className="skeleton skeleton-text" />
        <div className="skeleton skeleton-text" />
        <div className="skeleton skeleton-text" style={{ width: '60%' }} />
      </div>
    </div>
  )
}