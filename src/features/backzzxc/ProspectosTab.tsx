import { useState } from 'react'
import { EmptyState } from '../../components/shared/EmptyState'
import { Modal } from '../../components/shared/Modal'
import { ConfirmDialog } from '../../components/shared/ConfirmDialog'
import { useToast } from '../../contexts/ToastContext'
import { formatDate, todayISO } from '../../lib/formatters'
import type { ProspectoEstatusEnum } from '../../lib/database.types'
import { useCreateProspecto, useDeleteProspecto, useProspectos, useUpdateProspecto } from './hooks/useProspectos'

const ESTATUSES: ProspectoEstatusEnum[] = ['Nuevo', 'Contactado', 'Negociando', 'Ganado', 'Perdido']

type Prospecto = {
  id: string
  nombre: string
  contacto: string | null
  interes: string | null
  estatus: ProspectoEstatusEnum
  fecha: string
}

function ProspectoForm({ prospecto, onClose }: { prospecto?: Prospecto; onClose: () => void }) {
  const [nombre, setNombre] = useState(prospecto?.nombre ?? '')
  const [contacto, setContacto] = useState(prospecto?.contacto ?? '')
  const [interes, setInteres] = useState(prospecto?.interes ?? '')
  const [estatus, setEstatus] = useState<ProspectoEstatusEnum>(prospecto?.estatus ?? 'Nuevo')
  const [fecha, setFecha] = useState(prospecto?.fecha ?? todayISO())
  const create = useCreateProspecto()
  const update = useUpdateProspecto()
  const showToast = useToast()

  async function handleSubmit() {
    if (prospecto) {
      await update.mutateAsync({ id: prospecto.id, nombre, contacto, interes, estatus, fecha })
      showToast('Prospecto actualizado')
    } else {
      await create.mutateAsync({ nombre, contacto, interes, estatus, fecha })
      showToast('Prospecto agregado')
    }
    onClose()
  }

  return (
    <Modal title={prospecto ? 'Editar prospecto' : 'Nuevo prospecto'} onClose={onClose}>
      <div className="field">
        <label>Nombre</label>
        <input value={nombre} onChange={(e) => setNombre(e.target.value)} autoFocus />
      </div>
      <div className="two-col">
        <div className="field">
          <label>Contacto</label>
          <input value={contacto} onChange={(e) => setContacto(e.target.value)} />
        </div>
        <div className="field">
          <label>Estatus</label>
          <select value={estatus} onChange={(e) => setEstatus(e.target.value as ProspectoEstatusEnum)}>
            {ESTATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="field">
        <label>Interés</label>
        <input value={interes} onChange={(e) => setInteres(e.target.value)} placeholder="Qué le interesa" />
      </div>
      <div className="field">
        <label>Fecha</label>
        <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
      </div>
      <div className="modal-actions">
        <button className="btn ghost" onClick={onClose}>
          Cancelar
        </button>
        <button className="btn primary" onClick={handleSubmit} disabled={!nombre.trim()}>
          Guardar
        </button>
      </div>
    </Modal>
  )
}

export function ProspectosTab() {
  const { data: prospectos, isLoading } = useProspectos()
  const deleteProspecto = useDeleteProspecto()
  const showToast = useToast()
  const [editing, setEditing] = useState<Prospecto | 'new' | null>(null)
  const [borrando, setBorrando] = useState<Prospecto | null>(null)

  if (isLoading) return <EmptyState message="Cargando prospectos…" />

  return (
    <>
      <div className="section-row">
        <h2>Prospectos</h2>
        <button className="btn primary" onClick={() => setEditing('new')}>
          + Nuevo prospecto
        </button>
      </div>

      {!prospectos?.length ? (
        <EmptyState message="Todavía no tienes prospectos" />
      ) : (
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Interés</th>
              <th>Estatus</th>
              <th>Fecha</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {prospectos.map((p) => (
              <tr key={p.id}>
                <td>
                  {p.nombre}
                  <div style={{ fontSize: 11.5, opacity: 0.55 }}>{p.contacto}</div>
                </td>
                <td>{p.interes || '—'}</td>
                <td>
                  <span className={`pill lead-${p.estatus}`}>{p.estatus}</span>
                </td>
                <td>{formatDate(p.fecha)}</td>
                <td>
                  <div className="row-actions">
                    <button className="icon-btn" onClick={() => setEditing(p)}>
                      Editar
                    </button>
                    <button className="icon-btn" onClick={() => setBorrando(p)}>
                      Borrar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {editing === 'new' && <ProspectoForm onClose={() => setEditing(null)} />}
      {editing && editing !== 'new' && <ProspectoForm prospecto={editing} onClose={() => setEditing(null)} />}
      {borrando && (
        <ConfirmDialog
          title="Borrar prospecto"
          message={`¿Seguro que quieres borrar a "${borrando.nombre}"?`}
          confirmLabel="Borrar"
          danger
          onCancel={() => setBorrando(null)}
          onConfirm={async () => {
            await deleteProspecto.mutateAsync(borrando.id)
            showToast('Prospecto borrado')
            setBorrando(null)
          }}
        />
      )}
    </>
  )
}
