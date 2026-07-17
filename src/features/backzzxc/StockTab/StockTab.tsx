import { useMemo, useState } from 'react'
import { EmptyState } from '../../../components/shared/EmptyState'
import { ConfirmDialog } from '../../../components/shared/ConfirmDialog'
import { useToast } from '../../../contexts/ToastContext'
import { formatCurrency } from '../../../lib/formatters'
import { getProductoFotoUrl } from '../../../lib/photoUpload'
import { useDeleteProducto, useProductos, type ProductoConDetalle } from '../hooks/useProductos'
import { ProductoForm } from './ProductoForm'
import { FusionarModal } from './FusionarModal'

export function StockTab() {
  const { data: productos, isLoading } = useProductos()
  const deleteProducto = useDeleteProducto()
  const showToast = useToast()

  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<ProductoConDetalle | 'new' | null>(null)
  const [fusionando, setFusionando] = useState<ProductoConDetalle | null>(null)
  const [borrando, setBorrando] = useState<ProductoConDetalle | null>(null)

  const filtrados = useMemo(() => {
    if (!productos) return []
    const q = search.trim().toLowerCase()
    if (!q) return productos
    return productos.filter((p) => p.nombre.toLowerCase().includes(q) || p.corte.toLowerCase().includes(q))
  }, [productos, search])

  if (isLoading) return <EmptyState message="Cargando stock…" />

  return (
    <>
      <div className="section-row">
        <h2>Stock</h2>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            className="search-input"
            placeholder="Buscar por nombre o corte…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="btn primary" onClick={() => setEditing('new')}>
            + Nuevo producto
          </button>
        </div>
      </div>

      {!filtrados.length ? (
        <EmptyState message={search ? 'No hay productos que coincidan' : 'Todavía no hay productos en el catálogo'} />
      ) : (
        <table>
          <thead>
            <tr>
              <th></th>
              <th>Nombre</th>
              <th>Corte</th>
              <th>Tallas</th>
              <th>Precio</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((p) => {
              const frente = p.bz_producto_fotos.find((f) => f.tipo === 'frente')
              const totalStock = p.bz_producto_tallas.reduce((sum, t) => sum + t.cantidad, 0)
              return (
                <tr key={p.id}>
                  <td>
                    {frente ? (
                      <img
                        src={getProductoFotoUrl(frente.storage_path)}
                        alt={p.nombre}
                        style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6 }}
                      />
                    ) : (
                      <div style={{ width: 40, height: 40, borderRadius: 6, background: 'rgba(255,255,255,.06)' }} />
                    )}
                  </td>
                  <td>
                    {p.nombre}
                    {p.categoria !== 'General' && (
                      <>
                        {' '}
                        <span className="pill example">{p.categoria}</span>
                      </>
                    )}
                  </td>
                  <td>{p.corte}</td>
                  <td>
                    <span className={`pill ${totalStock === 0 ? 'out' : totalStock < 5 ? 'low' : 'ok'}`}>
                      {totalStock} pzas
                    </span>
                  </td>
                  <td>{formatCurrency(p.precio)}</td>
                  <td>
                    <div className="row-actions">
                      <button className="icon-btn" onClick={() => setEditing(p)}>
                        Editar
                      </button>
                      <button className="icon-btn" onClick={() => setFusionando(p)}>
                        Fusionar
                      </button>
                      <button className="icon-btn" onClick={() => setBorrando(p)}>
                        Borrar
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      {editing === 'new' && <ProductoForm onClose={() => setEditing(null)} />}
      {editing && editing !== 'new' && <ProductoForm producto={editing} onClose={() => setEditing(null)} />}
      {fusionando && productos && (
        <FusionarModal productos={productos} productoInicial={fusionando} onClose={() => setFusionando(null)} />
      )}
      {borrando && (
        <ConfirmDialog
          title="Borrar producto"
          message={`¿Seguro que quieres borrar "${borrando.nombre}"? Esta acción no se puede deshacer.`}
          confirmLabel="Borrar"
          danger
          onCancel={() => setBorrando(null)}
          onConfirm={async () => {
            await deleteProducto.mutateAsync(borrando.id)
            showToast('Producto borrado')
            setBorrando(null)
          }}
        />
      )}
    </>
  )
}
