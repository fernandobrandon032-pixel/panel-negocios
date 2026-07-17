import { useMemo, useState } from 'react'
import { EmptyState } from '../../components/shared/EmptyState'
import { Modal } from '../../components/shared/Modal'
import { ConfirmDialog } from '../../components/shared/ConfirmDialog'
import { useToast } from '../../contexts/ToastContext'
import { formatCurrency, formatDate, todayISO } from '../../lib/formatters'
import type { MovimientoTipoEnum } from '../../lib/database.types'
import { useCreateMovimiento, useDeleteMovimiento, useMovimientos } from './hooks/useMovimientos'
import { SpendingDonutChart } from './SpendingDonutChart'

const CATEGORIAS_SUGERIDAS = [
  'Entretenimiento/Gaming',
  'Comida',
  'Transporte',
  'Renta/Servicios',
  'Ropa',
  'Salud',
  'Ahorro',
  'Negocio',
  'Otro',
]

function NuevoMovimientoForm({ onClose }: { onClose: () => void }) {
  const [tipo, setTipo] = useState<MovimientoTipoEnum>('gasto')
  const [categoria, setCategoria] = useState(CATEGORIAS_SUGERIDAS[0])
  const [monto, setMonto] = useState(0)
  const [descripcion, setDescripcion] = useState('')
  const [fecha, setFecha] = useState(todayISO())
  const create = useCreateMovimiento()
  const showToast = useToast()

  async function handleSubmit() {
    await create.mutateAsync({ tipo, categoria, monto, descripcion, fecha })
    showToast('Movimiento registrado')
    onClose()
  }

  return (
    <Modal title="Nuevo movimiento" modalClassName="fz-modal" onClose={onClose}>
      <div className="sale-type-toggle">
        <button className={tipo === 'gasto' ? 'active' : ''} onClick={() => setTipo('gasto')}>
          Gasto
        </button>
        <button className={tipo === 'ingreso' ? 'active' : ''} onClick={() => setTipo('ingreso')}>
          Ingreso
        </button>
      </div>
      <div className="two-col">
        <div className="field">
          <label>Categoría</label>
          <select value={categoria} onChange={(e) => setCategoria(e.target.value)}>
            {CATEGORIAS_SUGERIDAS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Monto</label>
          <input type="number" min={0} value={monto} onChange={(e) => setMonto(Number(e.target.value))} />
        </div>
      </div>
      <div className="field">
        <label>Descripción</label>
        <input value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
      </div>
      <div className="field">
        <label>Fecha</label>
        <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
      </div>
      <div className="modal-actions">
        <button className="btn ghost" onClick={onClose}>
          Cancelar
        </button>
        <button className="btn primary" onClick={handleSubmit} disabled={monto <= 0}>
          Registrar
        </button>
      </div>
    </Modal>
  )
}

export function MovimientosTab() {
  const { data: movimientos, isLoading } = useMovimientos()
  const deleteMovimiento = useDeleteMovimiento()
  const showToast = useToast()
  const [creando, setCreando] = useState(false)
  const [borrando, setBorrando] = useState<{ id: string; descripcion: string | null } | null>(null)

  const gastoPorCategoria = useMemo(() => {
    const map = new Map<string, number>()
    for (const m of movimientos ?? []) {
      if (m.tipo !== 'gasto') continue
      map.set(m.categoria, (map.get(m.categoria) ?? 0) + m.monto)
    }
    return Array.from(map.entries()).map(([categoria, monto]) => ({ categoria, monto }))
  }, [movimientos])

  if (isLoading) return <EmptyState message="Cargando movimientos…" />

  return (
    <>
      <div className="section-row">
        <h2>Movimientos</h2>
        <button className="btn primary" onClick={() => setCreando(true)}>
          + Nuevo movimiento
        </button>
      </div>

      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 280 }}>
          {!movimientos?.length ? (
            <EmptyState message="Todavía no hay movimientos" />
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Categoría</th>
                  <th>Descripción</th>
                  <th>Monto</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {movimientos.map((m) => (
                  <tr key={m.id}>
                    <td>{formatDate(m.fecha)}</td>
                    <td>{m.categoria}</td>
                    <td>{m.descripcion || '—'}</td>
                    <td>
                      <span className={`pill ${m.tipo}`}>
                        {m.tipo === 'gasto' ? '-' : '+'}
                        {formatCurrency(m.monto)}
                      </span>
                    </td>
                    <td>
                      <button className="icon-btn" onClick={() => setBorrando(m)}>
                        Borrar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <SpendingDonutChart data={gastoPorCategoria} />
      </div>

      {creando && <NuevoMovimientoForm onClose={() => setCreando(false)} />}
      {borrando && (
        <ConfirmDialog
          title="Borrar movimiento"
          message="¿Seguro que quieres borrar este movimiento?"
          confirmLabel="Borrar"
          danger
          onCancel={() => setBorrando(null)}
          onConfirm={async () => {
            await deleteMovimiento.mutateAsync(borrando.id)
            showToast('Movimiento borrado')
            setBorrando(null)
          }}
        />
      )}
    </>
  )
}
