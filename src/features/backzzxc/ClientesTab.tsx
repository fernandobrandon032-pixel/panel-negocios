import { useState } from 'react'
import { EmptyState } from '../../components/shared/EmptyState'
import { Modal } from '../../components/shared/Modal'
import { ConfirmDialog } from '../../components/shared/ConfirmDialog'
import { useToast } from '../../contexts/ToastContext'
import { formatCurrency, formatDate } from '../../lib/formatters'
import { useClientes, useCreateCliente, useDeleteCliente, useUpdateCliente, type ClienteConStats } from './hooks/useClientes'

function ClienteForm({ cliente, onClose }: { cliente?: ClienteConStats; onClose: () => void }) {
  const [nombre, setNombre] = useState(cliente?.nombre ?? '')
  const [contacto, setContacto] = useState(cliente?.contacto ?? '')
  const [notas, setNotas] = useState(cliente?.notas ?? '')
  const create = useCreateCliente()
  const update = useUpdateCliente()
  const showToast = useToast()

  async function handleSubmit() {
    if (cliente) {
      await update.mutateAsync({ id: cliente.id, nombre, contacto, notas })
      showToast('Cliente actualizado')
    } else {
      await create.mutateAsync({ nombre, contacto, notas })
      showToast('Cliente agregado')
    }
    onClose()
  }

  return (
    <Modal title={cliente ? 'Editar cliente' : 'Nuevo cliente'} onClose={onClose}>
      <div className="field">
        <label>Nombre</label>
        <input value={nombre} onChange={(e) => setNombre(e.target.value)} autoFocus />
      </div>
      <div className="field">
        <label>Contacto</label>
        <input value={contacto} onChange={(e) => setContacto(e.target.value)} placeholder="Teléfono, Instagram…" />
      </div>
      <div className="field">
        <label>Notas</label>
        <textarea value={notas} onChange={(e) => setNotas(e.target.value)} />
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

export function ClientesTab() {
  const { data: clientes, isLoading } = useClientes()
  const deleteCliente = useDeleteCliente()
  const showToast = useToast()
  const [editing, setEditing] = useState<ClienteConStats | 'new' | null>(null)
  const [borrando, setBorrando] = useState<ClienteConStats | null>(null)

  if (isLoading) return <EmptyState message="Cargando clientes…" />

  return (
    <>
      <div className="section-row">
        <h2>Clientes</h2>
        <button className="btn primary" onClick={() => setEditing('new')}>
          + Nuevo cliente
        </button>
      </div>

      {!clientes?.length ? (
        <EmptyState message="Todavía no tienes clientes registrados" />
      ) : (
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Contacto</th>
              <th>Compras</th>
              <th>Gasto total</th>
              <th>Última compra</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {clientes.map((c) => (
              <tr key={c.id}>
                <td>{c.nombre}</td>
                <td>{c.contacto || '—'}</td>
                <td>{c.stats?.compras ?? 0}</td>
                <td>{formatCurrency(c.stats?.gasto_total ?? 0)}</td>
                <td>{c.stats?.ultima_compra ? formatDate(c.stats.ultima_compra) : '—'}</td>
                <td>
                  <div className="row-actions">
                    <button className="icon-btn" onClick={() => setEditing(c)}>
                      Editar
                    </button>
                    <button className="icon-btn" onClick={() => setBorrando(c)}>
                      Borrar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {editing === 'new' && <ClienteForm onClose={() => setEditing(null)} />}
      {editing && editing !== 'new' && <ClienteForm cliente={editing} onClose={() => setEditing(null)} />}
      {borrando && (
        <ConfirmDialog
          title="Borrar cliente"
          message={`¿Seguro que quieres borrar a "${borrando.nombre}"?`}
          confirmLabel="Borrar"
          danger
          onCancel={() => setBorrando(null)}
          onConfirm={async () => {
            await deleteCliente.mutateAsync(borrando.id)
            showToast('Cliente borrado')
            setBorrando(null)
          }}
        />
      )}
    </>
  )
}
