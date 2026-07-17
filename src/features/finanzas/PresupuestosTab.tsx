import { useState } from 'react'
import { EmptyState } from '../../components/shared/EmptyState'
import { Modal } from '../../components/shared/Modal'
import { useToast } from '../../contexts/ToastContext'
import { formatCurrency } from '../../lib/formatters'
import { useDeletePresupuesto, usePresupuestoProgreso, useUpsertPresupuesto } from './hooks/usePresupuestos'

const CATEGORIAS_SUGERIDAS = [
  'Entretenimiento/Gaming',
  'Comida',
  'Transporte',
  'Renta/Servicios',
  'Ropa',
  'Salud',
  'Negocio',
  'Otro',
]

function NuevoPresupuestoForm({ onClose }: { onClose: () => void }) {
  const [categoria, setCategoria] = useState(CATEGORIAS_SUGERIDAS[0])
  const [limite, setLimite] = useState(0)
  const upsert = useUpsertPresupuesto()
  const showToast = useToast()

  async function handleSubmit() {
    await upsert.mutateAsync({ categoria, limite })
    showToast('Presupuesto guardado')
    onClose()
  }

  return (
    <Modal title="Presupuesto del mes" modalClassName="fz-modal" onClose={onClose}>
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
        <label>Límite mensual</label>
        <input type="number" min={0} value={limite} onChange={(e) => setLimite(Number(e.target.value))} />
      </div>
      <div className="modal-actions">
        <button className="btn ghost" onClick={onClose}>
          Cancelar
        </button>
        <button className="btn primary" onClick={handleSubmit} disabled={limite <= 0}>
          Guardar
        </button>
      </div>
    </Modal>
  )
}

export function PresupuestosTab() {
  const { data: presupuestos, isLoading } = usePresupuestoProgreso()
  const deletePresupuesto = useDeletePresupuesto()
  const showToast = useToast()
  const [creando, setCreando] = useState(false)

  if (isLoading) return <EmptyState message="Cargando presupuestos…" />

  return (
    <>
      <div className="section-row">
        <h2>Presupuestos de este mes</h2>
        <button className="btn primary" onClick={() => setCreando(true)}>
          + Definir presupuesto
        </button>
      </div>

      {!presupuestos?.length ? (
        <EmptyState message="Todavía no has definido presupuestos para este mes" />
      ) : (
        presupuestos.map((p) => {
          const pct = p.limite > 0 ? Math.min(100, (p.gasto_real / p.limite) * 100) : 0
          const excedido = p.gasto_real > p.limite
          return (
            <div key={p.id} className="bar-row">
              <div className="bar-label">
                <span>{p.categoria}</span>
                <span>
                  {formatCurrency(p.gasto_real)} / {formatCurrency(p.limite)}
                  <button
                    className="icon-btn"
                    style={{ marginLeft: 8 }}
                    onClick={async () => {
                      await deletePresupuesto.mutateAsync(p.id)
                      showToast('Presupuesto borrado')
                    }}
                  >
                    Borrar
                  </button>
                </span>
              </div>
              <div className="bar-track">
                <div className={`bar-fill${excedido ? ' over' : ''}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          )
        })
      )}

      {creando && <NuevoPresupuestoForm onClose={() => setCreando(false)} />}
    </>
  )
}
