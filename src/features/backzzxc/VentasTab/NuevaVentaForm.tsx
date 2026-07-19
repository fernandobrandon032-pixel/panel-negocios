import { useState } from 'react'
import { Modal } from '../../../components/shared/Modal'
import { useToast } from '../../../contexts/ToastContext'
import { getProductoFotoUrl } from '../../../lib/photoUpload'
import { todayISO } from '../../../lib/formatters'
import type { TallaEnum } from '../../../lib/database.types'
import { useClientes, useCreateCliente } from '../hooks/useClientes'
import { useProductos, type ProductoConDetalle } from '../hooks/useProductos'
import { useEditarVenta, useRegistrarVenta, type VentaItemInput } from '../hooks/useVentas'
import { ProductoPickerModal } from './ProductoPickerModal'

interface LineaForm {
  productoId: string
  talla: TallaEnum | ''
  cantidad: number
  precioUnitario: number
}

export interface VentaExistente {
  id: string
  cliente_id: string | null
  fecha: string
  notas: string | null
  descontar_stock: boolean
  bz_venta_items: { producto_id: string; talla: TallaEnum; cantidad: number; precio_unitario: number }[]
}

const LINEA_VACIA: LineaForm = { productoId: '', talla: '', cantidad: 1, precioUnitario: 0 }

function NuevoClienteInline({ onCreated }: { onCreated: (clienteId: string) => void }) {
  const [abierto, setAbierto] = useState(false)
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const crear = useCreateCliente()
  const showToast = useToast()

  if (!abierto) {
    return (
      <button className="btn ghost small" onClick={() => setAbierto(true)} style={{ marginTop: 8 }}>
        + Nuevo cliente
      </button>
    )
  }

  return (
    <div className="two-col" style={{ marginTop: 8, alignItems: 'end' }}>
      <div className="field">
        <label>Nombre del cliente</label>
        <input value={nombre} onChange={(e) => setNombre(e.target.value)} autoFocus />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <div className="field" style={{ flex: 1 }}>
          <label>Teléfono</label>
          <input value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="10 dígitos" />
        </div>
        <button
          className="btn primary"
          style={{ height: 38 }}
          disabled={!nombre.trim() || crear.isPending}
          onClick={async () => {
            const nuevo = await crear.mutateAsync({ nombre: nombre.trim(), contacto: telefono.trim() })
            showToast('Cliente agregado')
            onCreated(nuevo.id)
            setAbierto(false)
            setNombre('')
            setTelefono('')
          }}
        >
          Guardar
        </button>
      </div>
    </div>
  )
}

function ProductoButton({ producto, onClick }: { producto?: ProductoConDetalle; onClick: () => void }) {
  const foto = producto ? (producto.bz_producto_fotos.find((f) => f.tipo === 'espalda') ?? producto.bz_producto_fotos[0]) : null

  return (
    <button
      type="button"
      onClick={onClick}
      className="icon-btn"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        width: '100%',
        padding: '6px 10px',
        minHeight: 44,
        textAlign: 'left',
      }}
    >
      <div style={{ width: 32, height: 32, borderRadius: 6, overflow: 'hidden', flexShrink: 0, background: 'rgba(255,255,255,.06)' }}>
        {foto && <img src={getProductoFotoUrl(foto.storage_path)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
      </div>
      <span style={{ fontSize: 12.5 }}>{producto ? producto.nombre : 'Elegir producto…'}</span>
    </button>
  )
}

export function NuevaVentaForm({ onClose, venta }: { onClose: () => void; venta?: VentaExistente }) {
  const editando = !!venta
  const { data: clientes } = useClientes()
  const { data: productos } = useProductos()
  const registrarVenta = useRegistrarVenta()
  const editarVenta = useEditarVenta()
  const showToast = useToast()

  const [clienteId, setClienteId] = useState(venta?.cliente_id ?? '')
  const [fecha, setFecha] = useState(venta ? venta.fecha.slice(0, 10) : todayISO())
  const [ventaPasada, setVentaPasada] = useState(venta ? !venta.descontar_stock : false)
  const [notas, setNotas] = useState(venta?.notas ?? '')
  const [lineas, setLineas] = useState<LineaForm[]>(
    venta
      ? venta.bz_venta_items.map((i) => ({
          productoId: i.producto_id,
          talla: i.talla,
          cantidad: i.cantidad,
          precioUnitario: i.precio_unitario,
        }))
      : [{ ...LINEA_VACIA }]
  )
  const [error, setError] = useState<string | null>(null)
  const [pickerParaLinea, setPickerParaLinea] = useState<number | null>(null)

  // Al editar, la talla que ya traía la venta debe seguir apareciendo aunque su stock actual
  // muestre 0 (porque esa misma venta es la que lo tiene reservado hasta que se guarde el cambio).
  const sinRestriccionDeStock = ventaPasada || editando

  function actualizarLinea(index: number, cambios: Partial<LineaForm>) {
    setLineas((prev) => prev.map((l, i) => (i === index ? { ...l, ...cambios } : l)))
  }

  function seleccionarProducto(index: number, producto: ProductoConDetalle) {
    actualizarLinea(index, { productoId: producto.id, precioUnitario: producto.precio, talla: '' })
    setPickerParaLinea(null)
  }

  const total = lineas.reduce((sum, l) => sum + l.cantidad * l.precioUnitario, 0)
  const guardando = registrarVenta.isPending || editarVenta.isPending

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
      if (venta) {
        await editarVenta.mutateAsync({
          ventaId: venta.id,
          clienteId: clienteId || null,
          items,
          notas,
          fecha,
          descontarStock: !ventaPasada,
        })
        showToast('Venta actualizada')
      } else {
        await registrarVenta.mutateAsync({
          clienteId: clienteId || null,
          items,
          notas,
          fecha,
          descontarStock: !ventaPasada,
        })
        showToast('Venta registrada')
      }
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar la venta')
    }
  }

  return (
    <Modal
      title={editando ? 'Editar venta' : 'Nueva venta'}
      sub="Puedes agregar varios productos en una sola venta (mayoreo)."
      onClose={onClose}
      wide
    >
      <div className="two-col">
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
        <div className="field">
          <label>Fecha de la venta</label>
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </div>
      </div>
      <NuevoClienteInline onCreated={setClienteId} />

      <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, fontSize: 12.5 }}>
        <input type="checkbox" checked={ventaPasada} onChange={(e) => setVentaPasada(e.target.checked)} />
        Venta pasada — no descontar del stock actual (para piezas que ya no tienes)
      </label>

      <div style={{ marginTop: 18 }}>
        {lineas.map((linea, index) => {
          const producto = productos?.find((p) => p.id === linea.productoId)
          const tallasDisponibles = sinRestriccionDeStock
            ? (producto?.bz_producto_tallas ?? [])
            : (producto?.bz_producto_tallas.filter((t) => t.cantidad > 0) ?? [])
          return (
            <div key={index} className="two-col" style={{ marginBottom: 10, alignItems: 'end' }}>
              <div className="field">
                <label>Producto</label>
                <ProductoButton producto={producto} onClick={() => setPickerParaLinea(index)} />
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
                <div className="field" style={{ width: 74 }}>
                  <label>Cant.</label>
                  <input
                    type="number"
                    min={1}
                    className="qty-input"
                    value={linea.cantidad}
                    onChange={(e) => actualizarLinea(index, { cantidad: Number(e.target.value) })}
                  />
                </div>
                <div className="field" style={{ width: 96 }}>
                  <label>Precio</label>
                  <input
                    type="number"
                    min={0}
                    className="qty-input"
                    value={linea.precioUnitario}
                    onChange={(e) => actualizarLinea(index, { precioUnitario: Number(e.target.value) })}
                  />
                </div>
                <button
                  className="icon-btn"
                  style={{ height: 44 }}
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
      </div>

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
        <button className="btn primary" onClick={handleSubmit} disabled={guardando}>
          {guardando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Registrar venta'}
        </button>
      </div>

      {pickerParaLinea !== null && productos && (
        <ProductoPickerModal
          productos={productos}
          permitirSinStock={sinRestriccionDeStock}
          onSelect={(p) => seleccionarProducto(pickerParaLinea, p)}
          onClose={() => setPickerParaLinea(null)}
        />
      )}
    </Modal>
  )
}
