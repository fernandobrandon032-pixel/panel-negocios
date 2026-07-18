import { useState } from 'react'
import { formatCurrency } from '../../../lib/formatters'
import { getProductoFotoUrl } from '../../../lib/photoUpload'
import type { ProductoConDetalle } from '../hooks/useProductos'

export function ProductoCard({
  producto,
  onEdit,
  onFusionar,
  onBorrar,
}: {
  producto: ProductoConDetalle
  onEdit: () => void
  onFusionar: () => void
  onBorrar: () => void
}) {
  const [fotoIndex, setFotoIndex] = useState(0)
  const [tallasAbiertas, setTallasAbiertas] = useState(false)

  const frente = producto.bz_producto_fotos.find((f) => f.tipo === 'frente')
  const espalda = producto.bz_producto_fotos.find((f) => f.tipo === 'espalda')
  const fotos = [frente, espalda].filter(Boolean) as typeof producto.bz_producto_fotos
  const fotoActual = fotos[fotoIndex] ?? fotos[0]

  const totalStock = producto.bz_producto_tallas.reduce((sum, t) => sum + t.cantidad, 0)
  const stockClass = totalStock === 0 ? 'out' : totalStock < 5 ? 'low' : 'ok'

  return (
    <div className="product-card" onClick={onEdit}>
      <div
        className="product-card-image"
        onClick={(e) => {
          if (fotos.length > 1) {
            e.stopPropagation()
            setFotoIndex((i) => (i + 1) % fotos.length)
          }
        }}
      >
        {fotoActual ? (
          <img src={getProductoFotoUrl(fotoActual.storage_path)} alt={producto.nombre} />
        ) : (
          <div className="no-photo">Sin foto todavía</div>
        )}
        <span className={`pill ${stockClass} product-card-stock-badge`}>{totalStock} pzas</span>
        {fotos.length > 1 && (
          <>
            <div className="product-card-flip-hint">
              <span>Click para ver {fotoIndex === 0 ? 'espalda' : 'frente'}</span>
            </div>
            <div className="product-card-dots">
              {fotos.map((_, i) => (
                <span key={i} className={`dot${i === fotoIndex ? ' active' : ''}`} />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="product-card-body">
        <div>
          <div className="product-card-title">{producto.nombre}</div>
          <div className="product-card-subtitle">
            {producto.corte}
            {producto.categoria !== 'General' ? ` · ${producto.categoria}` : ''}
          </div>
        </div>
        <div className="product-card-price">{formatCurrency(producto.precio)}</div>

        <button
          className="tallas-toggle"
          onClick={(e) => {
            e.stopPropagation()
            setTallasAbiertas((v) => !v)
          }}
        >
          {tallasAbiertas ? 'Ocultar tallas' : 'Ver tallas'}
        </button>
        {tallasAbiertas && (
          <div className="tallas-expand" onClick={(e) => e.stopPropagation()}>
            {producto.bz_producto_tallas.map((t) => (
              <div className="talla-cell" key={t.talla}>
                {t.talla}
                <b>{t.cantidad}</b>
              </div>
            ))}
          </div>
        )}

        <div className="product-card-actions" onClick={(e) => e.stopPropagation()}>
          <button className="icon-btn" onClick={onEdit}>
            Editar
          </button>
          <button className="icon-btn" onClick={onFusionar}>
            Fusionar
          </button>
          <button className="icon-btn" onClick={onBorrar}>
            Borrar
          </button>
        </div>
      </div>
    </div>
  )
}
