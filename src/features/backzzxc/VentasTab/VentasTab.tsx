import { useState } from 'react'
import { EmptyState } from '../../../components/shared/EmptyState'
import { formatCurrency, formatDate } from '../../../lib/formatters'
import { useVentas } from '../hooks/useVentas'
import { NuevaVentaForm } from './NuevaVentaForm'

interface VentaItemJoined {
  cantidad: number
  precio_unitario: number
  talla: string
  bz_productos: { nombre: string } | null
}

export function VentasTab() {
  const { data: ventas, isLoading } = useVentas()
  const [creando, setCreando] = useState(false)

  if (isLoading) return <EmptyState message="Cargando ventas…" />

  return (
    <>
      <div className="section-row">
        <h2>Ventas</h2>
        <button className="btn primary" onClick={() => setCreando(true)}>
          + Nueva venta
        </button>
      </div>

      {!ventas?.length ? (
        <EmptyState message="Todavía no hay ventas registradas" />
      ) : (
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Cliente</th>
              <th>Productos</th>
              <th>Origen</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {ventas.map((v) => {
              const items = (v.bz_venta_items ?? []) as VentaItemJoined[]
              const total = items.reduce((sum, i) => sum + i.cantidad * i.precio_unitario, 0)
              return (
                <tr key={v.id}>
                  <td>{formatDate(v.fecha)}</td>
                  <td>{v.bz_clientes?.nombre ?? 'Mostrador'}</td>
                  <td>
                    {items
                      .map((i) => `${i.bz_productos?.nombre ?? '—'} (${i.talla} ×${i.cantidad})`)
                      .join(', ')}
                  </td>
                  <td>
                    <span className={`pill ${v.origen === 'consignacion' ? 'low' : 'ok'}`}>{v.origen}</span>
                  </td>
                  <td>{formatCurrency(total)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      {creando && <NuevaVentaForm onClose={() => setCreando(false)} />}
    </>
  )
}
