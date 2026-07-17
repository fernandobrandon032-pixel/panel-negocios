import type { ReactNode } from 'react'

export function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric-card">
      <div className="label">{label}</div>
      <div className="value">{value}</div>
    </div>
  )
}

export function MetricGrid({ children }: { children: ReactNode }) {
  return <div className="metric-grid">{children}</div>
}
