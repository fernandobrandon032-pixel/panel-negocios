import { useMemo, useState } from 'react'
import { EmptyState } from '../../../components/shared/EmptyState'
import { ConfirmDialog } from '../../../components/shared/ConfirmDialog'
import { useToast } from '../../../contexts/ToastContext'
import { useDeleteProducto, useProductos, type ProductoConDetalle } from '../hooks/useProductos'
import { ProductoForm } from './ProductoForm'
import { FusionarModal } from './FusionarModal'
import { ProductoCard } from './ProductoCard'

type OrdenOpcion = 'nombre-asc' | 'nombre-desc' | 'reciente' | 'antiguo' | 'precio-asc' | 'precio-desc'

const ORDEN_LABELS: Record<OrdenOpcion, string> = {
  'nombre-asc': 'Nombre: A-Z',
  'nombre-desc': 'Nombre: Z-A',
  reciente: 'Más recientes',
  antiguo: 'Más antiguas',
  'precio-asc': 'Precio: menor a mayor',
  'precio-desc': 'Precio: mayor a menor',
}

function ordenar(productos: ProductoConDetalle[], orden: OrdenOpcion): ProductoConDetalle[] {
  const copia = [...productos]
  switch (orden) {
    case 'nombre-asc':
      return copia.sort((a, b) => a.nombre.localeCompare(b.nombre))
    case 'nombre-desc':
      return copia.sort((a, b) => b.nombre.localeCompare(a.nombre))
    case 'reciente':
      return copia.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    case 'antiguo':
      return copia.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    case 'precio-asc':
      return copia.sort((a, b) => a.precio - b.precio)
    case 'precio-desc':
      return copia.sort((a, b) => b.precio - a.precio)
  }
}

export function StockTab() {
  const { data: productos, isLoading } = useProductos()
  const deleteProducto = useDeleteProducto()
  const showToast = useToast()

  const [search, setSearch] = useState('')
  const [orden, setOrden] = useState<OrdenOpcion>('nombre-asc')
  const [editing, setEditing] = useState<ProductoConDetalle | 'new' | null>(null)
  const [fusionando, setFusionando] = useState<ProductoConDetalle | null>(null)
  const [borrando, setBorrando] = useState<ProductoConDetalle | null>(null)

  const filtrados = useMemo(() => {
    if (!productos) return []
    const q = search.trim().toLowerCase()
    const base = q
      ? productos.filter((p) => p.nombre.toLowerCase().includes(q) || p.corte.toLowerCase().includes(q))
      : productos
    return ordenar(base, orden)
  }, [productos, search, orden])

  if (isLoading) return <EmptyState message="Cargando stock…" />

  return (
    <>
      <div className="section-row">
        <h2>Stock</h2>
        <div className="toolbar-row">
          <input
            className="search-input"
            placeholder="Buscar por nombre o corte…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select className="sort-select" value={orden} onChange={(e) => setOrden(e.target.value as OrdenOpcion)}>
            {(Object.keys(ORDEN_LABELS) as OrdenOpcion[]).map((key) => (
              <option key={key} value={key}>
                {ORDEN_LABELS[key]}
              </option>
            ))}
          </select>
          <button className="btn primary" onClick={() => setEditing('new')}>
            + Nuevo producto
          </button>
        </div>
      </div>

      {!filtrados.length ? (
        <EmptyState message={search ? 'No hay productos que coincidan' : 'Todavía no hay productos en el catálogo'} />
      ) : (
        <div className="product-grid">
          {filtrados.map((p) => (
            <ProductoCard
              key={p.id}
              producto={p}
              onEdit={() => setEditing(p)}
              onFusionar={() => setFusionando(p)}
              onBorrar={() => setBorrando(p)}
            />
          ))}
        </div>
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
