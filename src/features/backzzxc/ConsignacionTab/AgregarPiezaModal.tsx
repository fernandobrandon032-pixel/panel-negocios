import { useState } from 'react'
import { Modal } from '../../../components/shared/Modal'
import { useToast } from '../../../contexts/ToastContext'
import type { TallaEnum } from '../../../lib/database.types'
import { useProductos } from '../hooks/useProductos'
import { useAgregarPieza } from '../hooks/useConsignacion'

export function AgregarPiezaModal({ consignacionId, onClose }: { consignacionId: string; onClose: () => void }) {
  const { data: productos } = useProductos()
  const agregarPieza = useAgregarPieza()
  const showToast = useToast()

  const [productoId, setProductoId] = useState('')
  const [talla, setTalla] = useState<TallaEnum | ''>('')
  const [cantidad, setCantidad] = useState(1)
  const [error, setError] = useState<string | null>(null)

  const producto = productos?.find((p) => p.id === productoId)
  const tallasDisponibles = producto?.bz_producto_tallas.filter((t) => t.cantidad > 0) ?? []

  async function handleSubmit() {
    if (!productoId || !talla) {
      setError('Elige un producto y una talla')
      return
    }
    try {
      await agregarPieza.mutateAsync({ consignacion_id: consignacionId, producto_id: productoId, talla, cantidad })
      showToast('Pieza agregada a la consignación')
      onClose()
    } catch {
      setError('No se pudo agregar la pieza')
    }
  }

  return (
    <Modal title="Agregar pieza a consignación" onClose={onClose}>
      <div className="field">
        <label>Producto</label>
        <select value={productoId} onChange={(e) => { setProductoId(e.target.value); setTalla('') }}>
          <option value="">Selecciona…</option>
          {productos?.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
            </option>
          ))}
        </select>
      </div>
      <div className="two-col">
        <div className="field">
          <label>Talla</label>
          <select value={talla} onChange={(e) => setTalla(e.target.value as TallaEnum)} disabled={!producto}>
            <option value="">—</option>
            {tallasDisponibles.map((t) => (
              <option key={t.talla} value={t.talla}>
                {t.talla} ({t.cantidad} en stock)
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Cantidad</label>
          <input type="number" min={1} value={cantidad} onChange={(e) => setCantidad(Number(e.target.value))} />
        </div>
      </div>
      {error && <div className="auth-error">{error}</div>}
      <div className="modal-actions">
        <button className="btn ghost" onClick={onClose}>
          Cancelar
        </button>
        <button className="btn primary" onClick={handleSubmit} disabled={agregarPieza.isPending}>
          Agregar
        </button>
      </div>
    </Modal>
  )
}
