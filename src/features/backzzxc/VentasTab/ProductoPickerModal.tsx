import { useMemo, useState } from 'react'
import { Modal } from '../../../components/shared/Modal'
import { formatCurrency } from '../../../lib/formatters'
import { getProductoFotoUrl } from '../../../lib/photoUpload'
import type { ProductoConDetalle } from '../hooks/useProductos'

// Selector visual de producto (con foto) para la venta — el nombre de muchos modelos es solo
// "Boss 04" o "Hugo 02", que nadie recuerda de memoria; con la foto es inmediato.
export function ProductoPickerModal({
  productos,
  onSelect,
  onClose,
}: {
  productos: ProductoConDetalle[]
  onSelect: (producto: ProductoConDetalle) => void
  onClose: () => void
}) {
  const [search, setSearch] = useState('')

  const filtrados = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return productos
    return productos.filter((p) => p.nombre.toLowerCase().includes(q) || p.marca?.toLowerCase().includes(q))
  }, [productos, search])

  return (
    <Modal title="Elegir producto" onClose={onClose} wide>
      <input
        className="search-input"
        placeholder="Buscar por nombre o marca…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ width: '100%', marginBottom: 14 }}
        autoFocus
      />
      <div style={{ maxHeight: 420, overflowY: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 10 }}>
          {filtrados.map((p) => {
            const foto = p.bz_producto_fotos.find((f) => f.tipo === 'espalda') ?? p.bz_producto_fotos[0]
            const totalStock = p.bz_producto_tallas.reduce((sum, t) => sum + t.cantidad, 0)
            return (
              <button
                key={p.id}
                onClick={() => onSelect(p)}
                disabled={totalStock === 0}
                style={{
                  border: '1px solid var(--bz-line)',
                  borderRadius: 10,
                  overflow: 'hidden',
                  background: 'none',
                  cursor: totalStock === 0 ? 'not-allowed' : 'pointer',
                  opacity: totalStock === 0 ? 0.4 : 1,
                  padding: 0,
                  textAlign: 'left',
                  color: 'inherit',
                }}
              >
                <div style={{ width: '100%', aspectRatio: '1', background: 'rgba(255,255,255,.05)' }}>
                  {foto ? (
                    <img
                      src={getProductoFotoUrl(foto.storage_path)}
                      alt={p.nombre}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, opacity: 0.4 }}>
                      Sin foto
                    </div>
                  )}
                </div>
                <div style={{ padding: '6px 8px' }}>
                  <div style={{ fontSize: 11.5, fontWeight: 700, lineHeight: 1.2 }}>{p.nombre}</div>
                  <div style={{ fontSize: 10.5, opacity: 0.6 }}>{formatCurrency(p.precio)}</div>
                </div>
              </button>
            )
          })}
        </div>
        {!filtrados.length && <div style={{ opacity: 0.6, fontSize: 13 }}>No hay productos que coincidan.</div>}
      </div>
      <div className="modal-actions">
        <button className="btn ghost" onClick={onClose}>
          Cancelar
        </button>
      </div>
    </Modal>
  )
}
