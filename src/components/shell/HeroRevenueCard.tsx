import type { ReactNode } from 'react'

export function HeroRevenueCard({
  label,
  value,
  sub,
  aside,
}: {
  label: string
  value: string
  sub?: string
  aside?: ReactNode
}) {
  return (
    <div className="hero-grid">
      <div className="hero-card">
        <div className="hero-label">{label}</div>
        <div className="hero-value">{value}</div>
        {sub && <div className="hero-sub">{sub}</div>}
      </div>
      {aside}
    </div>
  )
}
