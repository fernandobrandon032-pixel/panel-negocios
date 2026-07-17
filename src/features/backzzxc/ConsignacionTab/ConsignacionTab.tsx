import { useState } from 'react'
import { EmptyState } from '../../../components/shared/EmptyState'
import { useToast } from '../../../contexts/ToastContext'
import { formatCurrency, formatDate } from '../../../lib/formatters'
import { useConsignaciones, useMarcarPiezaDevuelta } from '../hooks/useConsignacion'
import { ConsignacionForm } from './ConsignacionForm'
import { AgregarPiezaModal } from './AgregarPiezaModal'
import { MarcarVendidaModal } from './MarcarVendidaModal'

interface PiezaJoined {
  id: string
  talla: string
  cantidad: number
  estado: 'en_exhibicion' | 'vendida' | 'devuelta'
  precio_venta: number | null
  ganancia_usuario: number | null
  bz_productos: { nombre: string } | null
}

export function ConsignacionTab() {
  const { data: consignaciones, isLoading } = useConsignaciones()
  const marcarDevuelta = useMarcarPiezaDevuelta()
  const showToast = useToast()

  const [creando, setCreando] = useState(false)
  const [agregandoPiezaA, setAgregandoPiezaA] = useState<string | null>(null)
  const [vendiendo, setVendiendo] = useState<{ piezaId: string; nombre: string; precio: number; comision: number } | null>(
    null
  )

  if (isLoading) return <EmptyState message="Cargando consignaciones…" />

  return (
    <>
      <div className="section-row">
        <h2>Consignación</h2>
        <button className="btn primary" onClick={() => setCreando(true)}>
          + Nueva consignación
        </button>
      </div>

      {!consignaciones?.length ? (
        <EmptyState message="Todavía no tienes consignaciones registradas" />
      ) : (
        consignaciones.map((c) => {
          const piezas = (c.bz_consignacion_piezas ?? []) as PiezaJoined[]
          return (
            <div key={c.id} className="note-box" style={{ marginBottom: 18 }}>
              <div className="section-row" style={{ margin: '0 0 12px' }}>
                <div>
                  <strong>{c.socio}</strong>
                  {c.ubicacion && <span style={{ opacity: 0.6 }}> · {c.ubicacion}</span>}
                  <div style={{ fontSize: 11.5, opacity: 0.55 }}>
                    Comisión {c.comision_pct}% · desde {formatDate(c.fecha)}
                  </div>
                </div>
                <button className="btn ghost small" onClick={() => setAgregandoPiezaA(c.id)}>
                  + Agregar pieza
                </button>
              </div>

              {!piezas.length ? (
                <div style={{ fontSize: 13, opacity: 0.6 }}>Sin piezas todavía.</div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Talla</th>
                      <th>Cant.</th>
                      <th>Estado</th>
                      <th>Ganancia</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {piezas.map((p) => (
                      <tr key={p.id}>
                        <td>{p.bz_productos?.nombre ?? '—'}</td>
                        <td>{p.talla}</td>
                        <td>{p.cantidad}</td>
                        <td>
                          <span className={`pill ${p.estado}`}>{p.estado.replace('_', ' ')}</span>
                        </td>
                        <td>{p.ganancia_usuario != null ? formatCurrency(p.ganancia_usuario) : '—'}</td>
                        <td>
                          {p.estado === 'en_exhibicion' && (
                            <div className="row-actions">
                              <button
                                className="icon-btn"
                                onClick={() =>
                                  setVendiendo({
                                    piezaId: p.id,
                                    nombre: p.bz_productos?.nombre ?? '',
                                    precio: 0,
                                    comision: c.comision_pct,
                                  })
                                }
                              >
                                Marcar vendida
                              </button>
                              <button
                                className="icon-btn"
                                onClick={async () => {
                                  await marcarDevuelta.mutateAsync(p.id)
                                  showToast('Pieza marcada como devuelta')
                                }}
                              >
                                Devuelta
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )
        })
      )}

      {creando && <ConsignacionForm onClose={() => setCreando(false)} />}
      {agregandoPiezaA && (
        <AgregarPiezaModal consignacionId={agregandoPiezaA} onClose={() => setAgregandoPiezaA(null)} />
      )}
      {vendiendo && (
        <MarcarVendidaModal
          piezaId={vendiendo.piezaId}
          nombreProducto={vendiendo.nombre}
          precioSugerido={vendiendo.precio}
          comisionPct={vendiendo.comision}
          onClose={() => setVendiendo(null)}
        />
      )}
    </>
  )
}
