import { useMemo, useState } from 'react'
import { EmptyState } from '../../../components/shared/EmptyState'
import { ConfirmDialog } from '../../../components/shared/ConfirmDialog'
import { useToast } from '../../../contexts/ToastContext'
import type { CorteEnum } from '../../../lib/database.types'
import { useDeleteProducto, useProductos, type ProductoConDetalle } from '../hooks/useProductos'
import { ProductoForm } from './ProductoForm'
import { FusionarModal } from './FusionarModal'
import { ProductoCard } from './ProductoCard'
import { BulkUploadModal } from './BulkUploadModal'

type OrdenOpcion = 'nombre-asc' | 'nombre-desc' | 'reciente' | 'antiguo' | 'precio-asc' | 'precio-desc'

const ORDEN_LABELS: Record<OrdenOpcion, string> = {
  'nombre-asc': 'Nombre: A-Z',
  'nombre-desc': 'Nombre: Z-A',
  reciente: 'Más recientes',
  antiguo: 'Más antiguas',
  'precio-asc': 'Precio: menor a mayor',
  'precio-desc': 'Precio: mayor a menor',
}

const ORDEN_CORTES: CorteEnum[] = ['Corte Recto', 'Corte Oversize', 'Corte Polo', 'Corte Niño']

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

function agruparPorMarca(productos: ProductoConDetalle[]): [string, ProductoConDetalle[]][] {
  const map = new Map<string, ProductoConDetalle[]>()
  for (const p of productos) {
    const marca = p.marca?.trim() || 'Sin marca'
    if (!map.has(marca)) map.set(marca, [])
    map.get(marca)!.push(p)
  }
  return Array.from(map.entries()).sort(([a], [b]) => (a === 'Sin marca' ? 1 : b === 'Sin marca' ? -1 : a.localeCompare(b)))
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
  const [cargaMasiva, setCargaMasiva] = useState(false)

  const filtrados = useMemo(() => {
    if (!productos) return []
    const q = search.trim().toLowerCase()
    const base = q
      ? productos.filter(
          (p) =>
            p.nombre.toLowerCase().includes(q) ||
            p.corte.toLowerCase().includes(q) ||
            p.marca?.toLowerCase().includes(q)
        )
      : productos
    return ordenar(base, orden)
  }, [productos, search, orden])

  const porCorte = useMemo(() => {
    const map = new Map<CorteEnum, ProductoConDetalle[]>()
    for (const p of filtrados) {
      if (!map.has(p.corte)) map.set(p.corte, [])
      map.get(p.corte)!.push(p)
    }
    return map
  }, [filtrados])

  if (isLoading) return <EmptyState message="Cargando stock…" />

  return (
    <>
      <div className="section-row">
        <h2>Stock</h2>
        <div className="toolbar-row">
          <input
            className="search-input"
            placeholder="Buscar por nombre, marca o corte…"
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
          <button className="btn ghost" onClick={() => setCargaMasiva(true)}>
            Carga masiva de fotos
          </button>
          <button className="btn primary" onClick={() => setEditing('new')}>
            + Nuevo producto
          </button>
        </div>
      </div>

      {!filtrados.length ? (
        <EmptyState message={search ? 'No hay productos que coincidan' : 'Todavía no hay productos en el catálogo'} />
      ) : (
        ORDEN_CORTES.filter((corte) => porCorte.has(corte)).map((corte) => (
          <div key={corte} style={{ marginBottom: 30 }}>
            <div className="corte-heading">
              {corte}
              <span className="corte-heading-count">{porCorte.get(corte)!.length} modelos</span>
            </div>
            {agruparPorMarca(porCorte.get(corte)!).map(([marca, items]) => (
              <div key={marca} style={{ marginBottom: 18 }}>
                <div className="marca-label">{marca}</div>
                <div className="product-grid">
                  {items.map((p) => (
                    <ProductoCard
                      key={p.id}
                      producto={p}
                      onEdit={() => setEditing(p)}
                      onFusionar={() => setFusionando(p)}
                      onBorrar={() => setBorrando(p)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))
      )}

      {editing === 'new' && <ProductoForm onClose={() => setEditing(null)} />}
      {editing && editing !== 'new' && <ProductoForm producto={editing} onClose={() => setEditing(null)} />}
      {fusionando && productos && (
        <FusionarModal productos={productos} productoInicial={fusionando} onClose={() => setFusionando(null)} />
      )}
      {cargaMasiva && productos && <BulkUploadModal productos={productos} onClose={() => setCargaMasiva(false)} />}
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
