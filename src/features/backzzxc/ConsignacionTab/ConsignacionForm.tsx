import { useState } from 'react'
import { Modal } from '../../../components/shared/Modal'
import { useToast } from '../../../contexts/ToastContext'
import { todayISO } from '../../../lib/formatters'
import { useCreateConsignacion } from '../hooks/useConsignacion'

export function ConsignacionForm({ onClose }: { onClose: () => void }) {
  const [socio, setSocio] = useState('')
  const [ubicacion, setUbicacion] = useState('')
  const [comisionPct, setComisionPct] = useState(20)
  const [fecha, setFecha] = useState(todayISO())
  const [notas, setNotas] = useState('')
  const create = useCreateConsignacion()
  const showToast = useToast()

  async function handleSubmit() {
    await create.mutateAsync({ socio, ubicacion, comision_pct: comisionPct, fecha, notas })
    showToast('Consignación creada')
    onClose()
  }

  return (
    <Modal title="Nueva consignación" onClose={onClose}>
      <div className="field">
        <label>Socio</label>
        <input value={socio} onChange={(e) => setSocio(e.target.value)} placeholder="Nombre del socio" autoFocus />
      </div>
      <div className="field">
        <label>Ubicación</label>
        <input value={ubicacion} onChange={(e) => setUbicacion(e.target.value)} placeholder="Ej. Barbería..." />
      </div>
      <div className="two-col">
        <div className="field">
          <label>Comisión (%)</label>
          <input type="number" min={0} max={100} value={comisionPct} onChange={(e) => setComisionPct(Number(e.target.value))} />
        </div>
        <div className="field">
          <label>Fecha</label>
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </div>
      </div>
      <div className="field">
        <label>Notas</label>
        <textarea value={notas} onChange={(e) => setNotas(e.target.value)} />
      </div>
      <div className="modal-actions">
        <button className="btn ghost" onClick={onClose}>
          Cancelar
        </button>
        <button className="btn primary" onClick={handleSubmit} disabled={!socio.trim()}>
          Crear
        </button>
      </div>
    </Modal>
  )
}
