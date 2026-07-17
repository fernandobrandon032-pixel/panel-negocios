import { useState } from 'react'
import { Modal } from '../../../components/shared/Modal'
import { useToast } from '../../../contexts/ToastContext'
import { formatCurrency } from '../../../lib/formatters'
import { useMarcarPiezaVendida } from '../hooks/useConsignacion'

export function MarcarVendidaModal({
  piezaId,
  nombreProducto,
  precioSugerido,
  comisionPct,
  onClose,
}: {
  piezaId: string
  nombreProducto: string
  precioSugerido: number
  comisionPct: number
  onClose: () => void
}) {
  const [precio, setPrecio] = useState(precioSugerido)
  const [error, setError] = useState<string | null>(null)
  const marcarVendida = useMarcarPiezaVendida()
  const showToast = useToast()

  const comision = precio * (comisionPct / 100)
  const ganancia = precio - comision

  async function handleSubmit() {
    try {
      await marcarVendida.mutateAsync({ piezaId, precioVenta: precio })
      showToast('Pieza marcada como vendida')
      onClose()
    } catch {
      setError('No se pudo marcar como vendida (revisa el stock disponible)')
    }
  }

  return (
    <Modal title="Marcar pieza vendida" sub={nombreProducto} onClose={onClose}>
      <div className="field">
        <label>Precio de venta</label>
        <input type="number" min={0} value={precio} onChange={(e) => setPrecio(Number(e.target.value))} />
      </div>
      <div className="note-box">
        Comisión del socio ({comisionPct}%): {formatCurrency(comision)}
        <br />
        Tu ganancia: <strong>{formatCurrency(ganancia)}</strong>
      </div>
      {error && <div className="auth-error">{error}</div>}
      <div className="modal-actions">
        <button className="btn ghost" onClick={onClose}>
          Cancelar
        </button>
        <button className="btn primary" onClick={handleSubmit} disabled={marcarVendida.isPending}>
          Confirmar venta
        </button>
      </div>
    </Modal>
  )
}
