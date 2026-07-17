import { useState } from 'react'
import { EmptyState } from '../../components/shared/EmptyState'
import { Modal } from '../../components/shared/Modal'
import { useToast } from '../../contexts/ToastContext'
import { formatCurrency } from '../../lib/formatters'
import { useAhorroAcumulado, useMetaAhorro, useUpdateMetaAhorro } from './hooks/useAhorro'

function EditarMetaForm({
  meta,
  onClose,
}: {
  meta: { id: string; nombre: string; monto_objetivo: number }
  onClose: () => void
}) {
  const [nombre, setNombre] = useState(meta.nombre)
  const [montoObjetivo, setMontoObjetivo] = useState(meta.monto_objetivo)
  const update = useUpdateMetaAhorro()
  const showToast = useToast()

  async function handleSubmit() {
    await update.mutateAsync({ id: meta.id, nombre, monto_objetivo: montoObjetivo })
    showToast('Meta actualizada')
    onClose()
  }

  return (
    <Modal title="Editar meta de ahorro" modalClassName="fz-modal" onClose={onClose}>
      <div className="field">
        <label>Nombre de la meta</label>
        <input value={nombre} onChange={(e) => setNombre(e.target.value)} />
      </div>
      <div className="field">
        <label>Monto objetivo</label>
        <input type="number" min={0} value={montoObjetivo} onChange={(e) => setMontoObjetivo(Number(e.target.value))} />
      </div>
      <div className="modal-actions">
        <button className="btn ghost" onClick={onClose}>
          Cancelar
        </button>
        <button className="btn primary" onClick={handleSubmit}>
          Guardar
        </button>
      </div>
    </Modal>
  )
}

export function AhorroTab() {
  const { data: meta, isLoading: loadingMeta } = useMetaAhorro()
  const { data: acumulado, isLoading: loadingAcumulado } = useAhorroAcumulado()
  const [editando, setEditando] = useState(false)

  if (loadingMeta || loadingAcumulado) return <EmptyState message="Cargando meta de ahorro…" />
  if (!meta) return <EmptyState message="Todavía no hay una meta de ahorro configurada" />

  const total = acumulado ?? 0
  const pct = meta.monto_objetivo > 0 ? Math.min(100, (total / meta.monto_objetivo) * 100) : 0

  return (
    <>
      <div className="section-row">
        <h2>Meta: {meta.nombre}</h2>
        <button className="btn ghost small" onClick={() => setEditando(true)}>
          Editar meta
        </button>
      </div>

      <div className="hero-card">
        <div className="hero-label">Ahorrado</div>
        <div className="hero-value">{formatCurrency(total)}</div>
        <div className="hero-sub">
          de {formatCurrency(meta.monto_objetivo)} ({pct.toFixed(0)}%)
        </div>
      </div>

      <div className="bar-track" style={{ height: 14 }}>
        <div className="bar-fill" style={{ width: `${pct}%` }} />
      </div>

      <div className="note-box" style={{ marginTop: 20 }}>
        Este avance se calcula sumando los movimientos con categoría "Ahorro" en la pestaña de
        Movimientos (ingresos menos gastos en esa categoría) — no es un contador aparte.
      </div>

      {editando && <EditarMetaForm meta={meta} onClose={() => setEditando(false)} />}
    </>
  )
}
