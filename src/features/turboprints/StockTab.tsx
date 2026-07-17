import { useState } from 'react'
import { EmptyState } from '../../components/shared/EmptyState'
import { Modal } from '../../components/shared/Modal'
import { ConfirmDialog } from '../../components/shared/ConfirmDialog'
import { useToast } from '../../contexts/ToastContext'
import { formatCurrency } from '../../lib/formatters'
import type { VarianteTipoEnum } from '../../lib/database.types'
import { useCarrosStock, useCreateStock, useDeleteStock, useStock, useUpdateStock } from './hooks/useStock'

interface StockItem {
  id: string
  nombre: string
  variante_label: string
  tipo_variante: VarianteTipoEnum
  precio: number
  costo: number | null
  cantidad: number
}

function StockForm({ item, onClose }: { item?: StockItem; onClose: () => void }) {
  const [nombre, setNombre] = useState(item?.nombre ?? '')
  const [varianteLabel, setVarianteLabel] = useState(item?.variante_label ?? '')
  const [tipoVariante, setTipoVariante] = useState<VarianteTipoEnum>(item?.tipo_variante ?? 'color')
  const [precio, setPrecio] = useState(item?.precio ?? 0)
  const [costo, setCosto] = useState(item?.costo ?? 0)
  const [cantidad, setCantidad] = useState(item?.cantidad ?? 0)
  const create = useCreateStock()
  const update = useUpdateStock()
  const showToast = useToast()

  async function handleSubmit() {
    const payload = { nombre, variante_label: varianteLabel, tipo_variante: tipoVariante, precio, costo, cantidad }
    if (item) {
      await update.mutateAsync({ id: item.id, ...payload })
      showToast('Producto actualizado')
    } else {
      await create.mutateAsync(payload)
      showToast('Producto agregado')
    }
    onClose()
  }

  return (
    <Modal title={item ? 'Editar producto' : 'Nuevo producto de stock'} modalClassName="tp-modal" onClose={onClose}>
      <div className="field">
        <label>Nombre</label>
        <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Mangas para el sol" autoFocus />
      </div>
      <div className="two-col">
        <div className="field">
          <label>Tipo de variante</label>
          <select value={tipoVariante} onChange={(e) => setTipoVariante(e.target.value as VarianteTipoEnum)}>
            <option value="color">Color</option>
            <option value="talla">Talla</option>
          </select>
        </div>
        <div className="field">
          <label>Variante</label>
          <input value={varianteLabel} onChange={(e) => setVarianteLabel(e.target.value)} placeholder="Blanca, M…" />
        </div>
      </div>
      <div className="two-col">
        <div className="field">
          <label>Precio</label>
          <input type="number" min={0} value={precio} onChange={(e) => setPrecio(Number(e.target.value))} />
        </div>
        <div className="field">
          <label>Costo</label>
          <input type="number" min={0} value={costo} onChange={(e) => setCosto(Number(e.target.value))} />
        </div>
      </div>
      <div className="field">
        <label>Cantidad en stock</label>
        <input type="number" min={0} value={cantidad} onChange={(e) => setCantidad(Number(e.target.value))} />
      </div>
      <div className="modal-actions">
        <button className="btn ghost" onClick={onClose}>
          Cancelar
        </button>
        <button className="btn primary" onClick={handleSubmit} disabled={!nombre.trim() || !varianteLabel.trim()}>
          Guardar
        </button>
      </div>
    </Modal>
  )
}

export function StockTab() {
  const { data: stock, isLoading } = useStock()
  const { data: carros, isLoading: loadingCarros } = useCarrosStock()
  const deleteStock = useDeleteStock()
  const showToast = useToast()
  const [editing, setEditing] = useState<StockItem | 'new' | null>(null)
  const [borrando, setBorrando] = useState<StockItem | null>(null)

  if (isLoading || loadingCarros) return <EmptyState message="Cargando stock…" />

  return (
    <>
      <div className="section-row">
        <h2>Stock propio</h2>
        <button className="btn primary" onClick={() => setEditing('new')}>
          + Nuevo producto
        </button>
      </div>

      {!stock?.length ? (
        <EmptyState message="Todavía no hay productos de stock propio" />
      ) : (
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Variante</th>
              <th>Cantidad</th>
              <th>Precio</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(stock as StockItem[]).map((s) => (
              <tr key={s.id}>
                <td>{s.nombre}</td>
                <td>{s.variante_label}</td>
                <td>
                  <span className={`pill ${s.cantidad === 0 ? 'out' : s.cantidad < 5 ? 'low' : 'ok'}`}>{s.cantidad}</span>
                </td>
                <td>{formatCurrency(s.precio)}</td>
                <td>
                  <div className="row-actions">
                    <button className="icon-btn" onClick={() => setEditing(s)}>
                      Editar
                    </button>
                    <button className="icon-btn" onClick={() => setBorrando(s)}>
                      Borrar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="section-row">
        <h2>Playeras de carros</h2>
      </div>
      <div className="note-box">Este catálogo vive en el stock de Backzzxc y se muestra aquí solo de lectura.</div>
      {!carros?.length ? (
        <EmptyState message="Todavía no hay playeras de carros en Backzzxc (categoría 'Carros')" />
      ) : (
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Corte</th>
              <th>Tallas en stock</th>
              <th>Precio</th>
            </tr>
          </thead>
          <tbody>
            {carros.map((p) => (
              <tr key={p.id}>
                <td>{p.nombre}</td>
                <td>{p.corte}</td>
                <td>
                  {p.bz_producto_tallas
                    .filter((t) => t.cantidad > 0)
                    .map((t) => `${t.talla} (${t.cantidad})`)
                    .join(', ') || 'Sin stock'}
                </td>
                <td>{formatCurrency(p.precio)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {editing === 'new' && <StockForm onClose={() => setEditing(null)} />}
      {editing && editing !== 'new' && <StockForm item={editing} onClose={() => setEditing(null)} />}
      {borrando && (
        <ConfirmDialog
          title="Borrar producto"
          message={`¿Seguro que quieres borrar "${borrando.nombre}"?`}
          confirmLabel="Borrar"
          danger
          onCancel={() => setBorrando(null)}
          onConfirm={async () => {
            await deleteStock.mutateAsync(borrando.id)
            showToast('Producto borrado')
            setBorrando(null)
          }}
        />
      )}
    </>
  )
}
