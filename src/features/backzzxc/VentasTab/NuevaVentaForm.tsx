import { useState } from 'react'
import { Modal } from '../../../components/shared/Modal'
import { useToast } from '../../../contexts/ToastContext'
import type { TallaEnum } from '../../../lib/database.types'
import { useClientes } from '../hooks/useClientes'
import { useProductos } from '../hooks/useProductos'
import { useRegistrarVenta, type VentaItemInput } from '../hooks/useVentas'

interface LineaForm {
  productoId: string
  talla: TallaEnum | ''
  cantidad: number
  precioUnitario: number
}

const LINEA_VACIA: LineaForm = { productoId: '', talla: '', cantidad: 1, precioUnitario: 0 }

export function NuevaVentaForm({ onClose }: { onClose: () => void }) {
  const { data: clientes } = useClientes()
  const { data: productos } = useProductos()
  const registrarVenta = useRegistrarVenta()
  const showToast = useToast()

  const [clienteId, setClienteId] = useState('')
  const [notas, setNotas] = useState('')
  const [lineas, setLineas] = useState<LineaForm[]>([{ ...LINEA_VACIA }])
  const [error, setError] = useState<string | null>(null)

  function actualizarLinea(index: number, cambios: Partial<LineaForm>) {
    setLineas((prev) => prev.map((l, i) => (i === index ? { ...l, ...cambios } : l)))
  }

  function seleccionarProducto(index: number, productoId: string) {
    const producto = productos?.find((p) => p.id === productoId)
    actualizarLinea(index, { productoId, precioUnitario: producto?.precio ?? 0, talla: '' })
  }

  const total = lineas.reduce((sum, l) => sum + l.cantidad * l.precioUnitario, 0)

  async function handleSubmit() {
    setError(null)
    const items: VentaItemInput[] = []
    for (const l of lineas) {
      if (!l.productoId || !l.talla || l.cantidad <= 0) continue
      items.push({ producto_id: l.productoId, talla: l.talla, cantidad: l.cantidad, precio_unitario: l.precioUnitario })
    }
    if (!items.length) {
      setError('Agrega al menos un producto con talla y cantidad')
      return
    }
    try {
      await registrarVenta.mutateAsync({ clienteId: clienteId || null, items, notas })
      showToast('Venta registrada')
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo registrar la venta')
    }
  }

  return (
    <Modal title="Nueva venta" sub="Puedes agregar varios productos en una sola venta (mayoreo)." onClose={onClose} wide>
      <div className="field">
        <label>Cliente</label>
        <select value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
          <option value="">Sin cliente / mostrador</option>
          {clientes?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
      </div>

      {lineas.map((linea, index) => {
        const producto = productos?.find((p) => p.id === linea.productoId)
        const tallasDisponibles = producto?.bz_producto_tallas.filter((t) => t.cantidad > 0) ?? []
        return (
          <div key={index} className="two-col" style={{ marginBottom: 10, alignItems: 'end' }}>
            <div className="field">
              <label>Producto</label>
              <select value={linea.productoId} onChange={(e) => seleccionarProducto(index, e.target.value)}>
                <option value="">Selecciona…</option>
                {productos?.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <div className="field" style={{ flex: 1 }}>
                <label>Talla</label>
                <select
                  value={linea.talla}
                  onChange={(e) => actualizarLinea(index, { talla: e.target.value as TallaEnum })}
                  disabled={!producto}
                >
                  <option value="">—</option>
                  {tallasDisponibles.map((t) => (
                    <option key={t.talla} value={t.talla}>
                      {t.talla} ({t.cantidad})
                    </option>
                  ))}
                </select>
              </div>
              <div className="field" style={{ width: 70 }}>
                <label>Cant.</label>
                <input
                  type="number"
                  min={1}
                  value={linea.cantidad}
                  onChange={(e) => actualizarLinea(index, { cantidad: Number(e.target.value) })}
                />
              </div>
              <div className="field" style={{ width: 90 }}>
                <label>Precio</label>
                <input
                  type="number"
                  min={0}
                  value={linea.precioUnitario}
                  onChange={(e) => actualizarLinea(index, { precioUnitario: Number(e.target.value) })}
                />
              </div>
              <button
                className="icon-btn"
                style={{ height: 38 }}
                onClick={() => setLineas((prev) => prev.filter((_, i) => i !== index))}
                disabled={lineas.length === 1}
              >
                Quitar
              </button>
            </div>
          </div>
        )
      })}
      <button className="btn ghost small" onClick={() => setLineas((prev) => [...prev, { ...LINEA_VACIA }])}>
        + Agregar producto
      </button>

      <div className="field" style={{ marginTop: 14 }}>
        <label>Notas</label>
        <input value={notas} onChange={(e) => setNotas(e.target.value)} />
      </div>

      <div style={{ fontSize: 15, fontWeight: 700, marginTop: 10 }}>Total: ${total.toFixed(2)}</div>

      {error && <div className="auth-error">{error}</div>}
      <div className="modal-actions">
        <button className="btn ghost" onClick={onClose}>
          Cancelar
        </button>
        <button className="btn primary" onClick={handleSubmit} disabled={registrarVenta.isPending}>
          {registrarVenta.isPending ? 'Registrando…' : 'Registrar venta'}
        </button>
      </div>
    </Modal>
  )
}
