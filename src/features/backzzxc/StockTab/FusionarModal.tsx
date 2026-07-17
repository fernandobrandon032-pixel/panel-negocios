import { useState } from 'react'
import { Modal } from '../../../components/shared/Modal'
import { useToast } from '../../../contexts/ToastContext'
import { useFusionarProductos, type ProductoConDetalle } from '../hooks/useProductos'

export function FusionarModal({
  productos,
  productoInicial,
  onClose,
}: {
  productos: ProductoConDetalle[]
  productoInicial: ProductoConDetalle
  onClose: () => void
}) {
  const [survivorId, setSurvivorId] = useState(productoInicial.id)
  const [mergedId, setMergedId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const fusionar = useFusionarProductos()
  const showToast = useToast()

  async function handleConfirm() {
    if (!mergedId || mergedId === survivorId) {
      setError('Elige dos productos distintos')
      return
    }
    try {
      await fusionar.mutateAsync({ survivorId, mergedId })
      showToast('Productos fusionados')
      onClose()
    } catch {
      setError('No se pudo fusionar')
    }
  }

  return (
    <Modal
      title="Fusionar productos"
      sub="Úsalo cuando dos piezas del catálogo son la misma playera (frente/espalda por separado). Se suman las tallas y se conservan las fotos que falten; el producto fusionado se borra."
      onClose={onClose}
    >
      <div className="field">
        <label>Producto que se conserva</label>
        <select value={survivorId} onChange={(e) => setSurvivorId(e.target.value)}>
          {productos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre} ({p.corte})
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label>Producto que se fusiona (se borrará)</label>
        <select value={mergedId} onChange={(e) => setMergedId(e.target.value)}>
          <option value="">Selecciona…</option>
          {productos
            .filter((p) => p.id !== survivorId)
            .map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre} ({p.corte})
              </option>
            ))}
        </select>
      </div>
      {error && <div className="auth-error">{error}</div>}
      <div className="modal-actions">
        <button className="btn ghost" onClick={onClose}>
          Cancelar
        </button>
        <button className="btn primary" onClick={handleConfirm} disabled={fusionar.isPending}>
          {fusionar.isPending ? 'Fusionando…' : 'Fusionar'}
        </button>
      </div>
    </Modal>
  )
}
