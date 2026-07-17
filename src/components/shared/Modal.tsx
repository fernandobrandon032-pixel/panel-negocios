import type { ReactNode } from 'react'

export function Modal({
  title,
  sub,
  onClose,
  children,
  wide,
  modalClassName = '',
}: {
  title: string
  sub?: string
  onClose: () => void
  children: ReactNode
  wide?: boolean
  modalClassName?: string
}) {
  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className={`modal ${modalClassName}${wide ? ' wide' : ''}`}>
        <h3>{title}</h3>
        {sub && <div className="modal-sub">{sub}</div>}
        {children}
      </div>
    </div>
  )
}
