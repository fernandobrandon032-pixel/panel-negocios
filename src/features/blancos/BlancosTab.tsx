import { useMemo, useState } from 'react'
import { EmptyState } from '../../components/shared/EmptyState'
import { useToast } from '../../contexts/ToastContext'
import type { CorteEnum, TallaEnum } from '../../lib/database.types'
import { useAgregarColorBlanco, useSetCantidadBlanco, useStockBlancos } from './hooks/useStockBlancos'
import { ShirtIcon } from './ShirtIcon'

const CORTES: CorteEnum[] = ['Corte Recto', 'Corte Oversize', 'Corte Polo', 'Corte Niño']
const TALLAS: TallaEnum[] = ['S', 'M', 'L', 'XL', 'XXL', 'XXXL']

function CantidadInput({
  corte,
  color,
  talla,
  cantidad,
}: {
  corte: CorteEnum
  color: string
  talla: TallaEnum
  cantidad: number
}) {
  const [valor, setValor] = useState(cantidad)
  const setCantidad = useSetCantidadBlanco()

  return (
    <input
      type="number"
      min={0}
      value={valor}
      onChange={(e) => setValor(Number(e.target.value))}
      onBlur={() => {
        if (valor !== cantidad) setCantidad.mutate({ corte, color, talla, cantidad: valor })
      }}
      className="qty-input"
      style={{ width: '100%' }}
    />
  )
}

function AgregarColorForm({ corte }: { corte: CorteEnum }) {
  const [color, setColor] = useState('')
  const agregar = useAgregarColorBlanco()
  const showToast = useToast()

  async function handleSubmit() {
    if (!color.trim()) return
    await agregar.mutateAsync({ corte, color: color.trim() })
    showToast(`Color "${color.trim()}" agregado`)
    setColor('')
  }

  return (
    <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
      <input
        className="search-input"
        placeholder="Nuevo color (ej. Gris, Rojo…)"
        value={color}
        onChange={(e) => setColor(e.target.value)}
        style={{ minWidth: 160 }}
      />
      <button className="btn ghost small" onClick={handleSubmit} disabled={!color.trim()}>
        + Agregar color
      </button>
    </div>
  )
}

export function BlancosTab() {
  const { data: stock, isLoading } = useStockBlancos()

  const porCorte = useMemo(() => {
    const map = new Map<CorteEnum, Map<string, Map<TallaEnum, number>>>()
    for (const row of stock ?? []) {
      if (!map.has(row.corte)) map.set(row.corte, new Map())
      const colores = map.get(row.corte)!
      if (!colores.has(row.color)) colores.set(row.color, new Map())
      colores.get(row.color)!.set(row.talla, row.cantidad)
    }
    return map
  }, [stock])

  if (isLoading) return <EmptyState message="Cargando playeras en blanco…" />

  return (
    <>
      <div className="section-row">
        <h2>Playeras lisas</h2>
      </div>
      <div className="note-box">
        Este stock es compartido entre Backzzxc y TurboPrints95 — es la misma playera lisa que se
        usa para estampar en ambos negocios, así que se actualiza sola en las dos pestañas (sin
        recargar la página).
      </div>

      {CORTES.map((corte) => {
        const colores = porCorte.get(corte)
        return (
          <div key={corte} style={{ marginBottom: 26 }}>
            <div className="section-row" style={{ margin: '0 0 10px' }}>
              <h2 style={{ fontSize: 14 }}>{corte}</h2>
            </div>

            {!colores?.size ? (
              <EmptyState message="Sin colores registrados en este corte todavía" />
            ) : (
              <table>
                <thead>
                  <tr>
                    <th></th>
                    <th>Color</th>
                    {TALLAS.map((t) => (
                      <th key={t} style={{ textAlign: 'center' }}>
                        {t}
                      </th>
                    ))}
                    <th style={{ textAlign: 'center' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from(colores.entries()).map(([color, tallas]) => {
                    const total = Array.from(tallas.values()).reduce((sum, c) => sum + c, 0)
                    return (
                      <tr key={color}>
                        <td>
                          <ShirtIcon color={color} size={28} />
                        </td>
                        <td>{color}</td>
                        {TALLAS.map((talla) => (
                          <td key={talla} style={{ width: 64 }}>
                            <CantidadInput corte={corte} color={color} talla={talla} cantidad={tallas.get(talla) ?? 0} />
                          </td>
                        ))}
                        <td style={{ textAlign: 'center' }}>
                          <span className={`pill ${total === 0 ? 'out' : total < 10 ? 'low' : 'ok'}`}>{total}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
            <AgregarColorForm corte={corte} />
          </div>
        )
      })}
    </>
  )
}
