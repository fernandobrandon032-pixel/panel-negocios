import { useState } from 'react'
import { EmptyState } from '../../components/shared/EmptyState'
import { Modal } from '../../components/shared/Modal'
import { ConfirmDialog } from '../../components/shared/ConfirmDialog'
import { useToast } from '../../contexts/ToastContext'
import { formatCurrency, formatDate, todayISO } from '../../lib/formatters'
import type { PedidoEstatusEnum, TallaEnum } from '../../lib/database.types'
import { useClientes } from './hooks/useClientes'
import { useCreatePedido, useDeletePedido, usePedidos, useUpdatePedido } from './hooks/usePedidos'

const ESTATUSES: PedidoEstatusEnum[] = ['Pendiente', 'En proceso', 'Listo', 'Entregado']
const TALLAS: TallaEnum[] = ['S', 'M', 'L', 'XL', 'XXL', 'XXXL']

interface Pedido {
  id: string
  cliente_id: string | null
  diseno: string
  talla: TallaEnum | null
  precio: number
  estatus: PedidoEstatusEnum
  fecha: string
  tp_clientes: { nombre: string } | null
}

function PedidoForm({ pedido, onClose }: { pedido?: Pedido; onClose: () => void }) {
  const { data: clientes } = useClientes()
  const [clienteId, setClienteId] = useState(pedido?.cliente_id ?? '')
  const [diseno, setDiseno] = useState(pedido?.diseno ?? '')
  const [talla, setTalla] = useState<TallaEnum | ''>(pedido?.talla ?? '')
  const [precio, setPrecio] = useState(pedido?.precio ?? 0)
  const [estatus, setEstatus] = useState<PedidoEstatusEnum>(pedido?.estatus ?? 'Pendiente')
  const [fecha, setFecha] = useState(pedido?.fecha ?? todayISO())
  const create = useCreatePedido()
  const update = useUpdatePedido()
  const showToast = useToast()

  async function handleSubmit() {
    const payload = {
      cliente_id: clienteId || undefined,
      diseno,
      talla: talla || undefined,
      precio,
      estatus,
      fecha,
    }
    if (pedido) {
      await update.mutateAsync({ id: pedido.id, ...payload })
      showToast('Pedido actualizado')
    } else {
      await create.mutateAsync(payload)
      showToast('Pedido creado')
    }
    onClose()
  }

  return (
    <Modal title={pedido ? 'Editar pedido' : 'Nuevo pedido'} modalClassName="tp-modal" onClose={onClose}>
      <div className="field">
        <label>Cliente</label>
        <select value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
          <option value="">Sin cliente</option>
          {clientes?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label>Diseño</label>
        <textarea value={diseno} onChange={(e) => setDiseno(e.target.value)} placeholder="Describe el diseño pedido" />
      </div>
      <div className="two-col">
        <div className="field">
          <label>Talla</label>
          <select value={talla} onChange={(e) => setTalla(e.target.value as TallaEnum)}>
            <option value="">—</option>
            {TALLAS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Precio</label>
          <input type="number" min={0} value={precio} onChange={(e) => setPrecio(Number(e.target.value))} />
        </div>
      </div>
      <div className="two-col">
        <div className="field">
          <label>Estatus</label>
          <select value={estatus} onChange={(e) => setEstatus(e.target.value as PedidoEstatusEnum)}>
            {ESTATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Fecha</label>
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </div>
      </div>
      <div className="modal-actions">
        <button className="btn ghost" onClick={onClose}>
          Cancelar
        </button>
        <button className="btn primary" onClick={handleSubmit} disabled={!diseno.trim()}>
          Guardar
        </button>
      </div>
    </Modal>
  )
}

export function PedidosTab() {
  const { data: pedidos, isLoading } = usePedidos()
  const deletePedido = useDeletePedido()
  const showToast = useToast()
  const [editing, setEditing] = useState<Pedido | 'new' | null>(null)
  const [borrando, setBorrando] = useState<Pedido | null>(null)

  if (isLoading) return <EmptyState message="Cargando pedidos…" />

  return (
    <>
      <div className="section-row">
        <h2>Pedidos</h2>
        <button className="btn primary" onClick={() => setEditing('new')}>
          + Nuevo pedido
        </button>
      </div>

      {!pedidos?.length ? (
        <EmptyState message="Todavía no hay pedidos" />
      ) : (
        <table>
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Diseño</th>
              <th>Talla</th>
              <th>Estatus</th>
              <th>Precio</th>
              <th>Fecha</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(pedidos as unknown as Pedido[]).map((p) => (
              <tr key={p.id}>
                <td>{p.tp_clientes?.nombre ?? 'Sin cliente'}</td>
                <td>{p.diseno}</td>
                <td>{p.talla ?? '—'}</td>
                <td>
                  <span className={`pill status-${p.estatus.replace(' ', '-')}`}>{p.estatus}</span>
                </td>
                <td>{formatCurrency(p.precio)}</td>
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

      {editing === 'new' && <PedidoForm onClose={() => setEditing(null)} />}
      {editing && editing !== 'new' && <PedidoForm pedido={editing} onClose={() => setEditing(null)} />}
      {borrando && (
        <ConfirmDialog
          title="Borrar pedido"
          message="¿Seguro que quieres borrar este pedido?"
          confirmLabel="Borrar"
          danger
          onCancel={() => setBorrando(null)}
          onConfirm={async () => {
            await deletePedido.mutateAsync(borrando.id)
            showToast('Pedido borrado')
            setBorrando(null)
          }}
        />
      )}
    </>
  )
}
