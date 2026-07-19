import { useState } from 'react'
import { EmptyState } from '../../../components/shared/EmptyState'
import { formatCurrency, formatDate } from '../../../lib/formatters'
import type { TallaEnum } from '../../../lib/database.types'
import { useVentas } from '../hooks/useVentas'
import { NuevaVentaForm, type VentaExistente } from './NuevaVentaForm'

interface VentaItemJoined {
  producto_id: string
  cantidad: number
  precio_unitario: number
  talla: TallaEnum
  bz_productos: { nombre: string } | null
}

interface VentaJoined {
  id: string
  cliente_id: string | null
  fecha: string
  notas: string | null
  origen: string
  descontar_stock: boolean
  bz_clientes: { nombre: string } | null
  bz_venta_items: VentaItemJoined[]
}

export function VentasTab() {
  const { data: ventas, isLoading } = useVentas()
  const [creando, setCreando] = useState(false)
  const [editando, setEditando] = useState<VentaExistente | null>(null)

  if (isLoading) return <EmptyState message="Cargando ventas…" />

  const ventasJoined = (ventas ?? []) as unknown as VentaJoined[]

  return (
    <>
      <div className="section-row">
        <h2>Ventas</h2>
        <button className="btn primary" onClick={() => setCreando(true)}>
          + Nueva venta
        </button>
      </div>

      {!ventasJoined.length ? (
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
              <th></th>
            </tr>
          </thead>
          <tbody>
            {ventasJoined.map((v) => {
              const items = v.bz_venta_items ?? []
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
                  <td>
                    <button
                      className="icon-btn"
                      onClick={() =>
                        setEditando({
                          id: v.id,
                          cliente_id: v.cliente_id,
                          fecha: v.fecha,
                          notas: v.notas,
                          descontar_stock: v.descontar_stock,
                          bz_venta_items: items.map((i) => ({
                            producto_id: i.producto_id,
                            talla: i.talla,
                            cantidad: i.cantidad,
                            precio_unitario: i.precio_unitario,
                          })),
                        })
                      }
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      {creando && <NuevaVentaForm onClose={() => setCreando(false)} />}
      {editando && <NuevaVentaForm venta={editando} onClose={() => setEditando(null)} />}
    </>
  )
}
