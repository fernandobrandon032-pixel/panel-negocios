import { Modal } from './Modal'

export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirmar',
  danger,
  onConfirm,
  onCancel,
}: {
  title: string
  message: string
  confirmLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <Modal title={title} onClose={onCancel}>
      <p style={{ fontSize: 13.5, opacity: 0.85, lineHeight: 1.5 }}>{message}</p>
      <div className="modal-actions">
        <button className="btn ghost" onClick={onCancel}>
          Cancelar
        </button>
        <button
          className="btn primary"
          style={danger ? { background: '#e26a6a', color: '#fff' } : undefined}
          onClick={onConfirm}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
