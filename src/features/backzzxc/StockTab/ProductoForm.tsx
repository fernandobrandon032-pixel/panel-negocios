import { useState } from 'react'
import { Modal } from '../../../components/shared/Modal'
import { PhotoUploader } from '../../../components/shared/PhotoUploader'
import type { CorteEnum, TallaEnum } from '../../../lib/database.types'
import { getProductoFotoUrl } from '../../../lib/photoUpload'
import { useToast } from '../../../contexts/ToastContext'
import {
  PRECIO_DEFAULT_POR_CORTE,
  useCreateProducto,
  useUpdateProducto,
  type ProductoConDetalle,
} from '../hooks/useProductos'

const CORTES: CorteEnum[] = ['Corte Recto', 'Corte Oversize', 'Corte Polo', 'Corte Niño']
const TALLAS: TallaEnum[] = ['S', 'M', 'L', 'XL', 'XXL', 'XXXL']

export function ProductoForm({ producto, onClose }: { producto?: ProductoConDetalle; onClose: () => void }) {
  const isEdit = !!producto
  const showToast = useToast()
  const createProducto = useCreateProducto()
  const updateProducto = useUpdateProducto()

  const [nombre, setNombre] = useState(producto?.nombre ?? '')
  const [marca, setMarca] = useState(producto?.marca ?? '')
  const [corte, setCorte] = useState<CorteEnum>(producto?.corte ?? 'Corte Recto')
  const [categoria, setCategoria] = useState(producto?.categoria ?? 'General')
  const [precio, setPrecio] = useState(producto?.precio ?? PRECIO_DEFAULT_POR_CORTE['Corte Recto'])
  const [notas, setNotas] = useState(producto?.notas ?? '')
  const [tallas, setTallas] = useState<Record<TallaEnum, number>>(() => {
    const base: Record<TallaEnum, number> = { S: 0, M: 0, L: 0, XL: 0, XXL: 0, XXXL: 0 }
    for (const t of producto?.bz_producto_tallas ?? []) base[t.talla] = t.cantidad
    return base
  })
  const [fotos, setFotos] = useState(() => {
    const map: Partial<Record<'frente' | 'espalda', string>> = {}
    for (const f of producto?.bz_producto_fotos ?? []) map[f.tipo] = getProductoFotoUrl(f.storage_path)
    return map
  })
  const [savedProductoId, setSavedProductoId] = useState(producto?.id)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    setError(null)
    try {
      if (isEdit && savedProductoId) {
        await updateProducto.mutateAsync({ id: savedProductoId, nombre, marca, corte, categoria, precio, notas, tallas })
        showToast('Producto actualizado')
        onClose()
      } else {
        const nuevo = await createProducto.mutateAsync({ nombre, marca, corte, categoria, precio, notas })
        setSavedProductoId(nuevo.id)
        showToast('Producto creado — ahora puedes agregarle fotos')
      }
    } catch {
      setError('No se pudo guardar el producto')
    }
  }

  function handleCorteChange(next: CorteEnum) {
    setCorte(next)
    if (!isEdit) setPrecio(PRECIO_DEFAULT_POR_CORTE[next])
  }

  const saving = createProducto.isPending || updateProducto.isPending

  return (
    <Modal title={isEdit || savedProductoId ? 'Editar producto' : 'Nuevo producto'} onClose={onClose}>
      <div className="field">
        <label>Nombre</label>
        <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Amiri 03" />
      </div>
      <div className="field">
        <label>Marca</label>
        <input value={marca} onChange={(e) => setMarca(e.target.value)} placeholder="Ej. Amiri, Boss, Hugo…" />
      </div>
      <div className="two-col">
        <div className="field">
          <label>Corte</label>
          <select value={corte} onChange={(e) => handleCorteChange(e.target.value as CorteEnum)}>
            {CORTES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Categoría</label>
          <input value={categoria} onChange={(e) => setCategoria(e.target.value)} placeholder="General, Carros…" />
        </div>
      </div>
      <div className="field">
        <label>Precio</label>
        <input type="number" min={0} value={precio} onChange={(e) => setPrecio(Number(e.target.value))} />
      </div>
      <div className="field">
        <label>Notas</label>
        <textarea value={notas} onChange={(e) => setNotas(e.target.value)} />
      </div>

      {savedProductoId && (
        <>
          <div className="field">
            <label>Tallas en stock</label>
            <div className="size-grid">
              {TALLAS.map((talla) => (
                <div className="sz" key={talla}>
                  <label>{talla}</label>
                  <input
                    type="number"
                    min={0}
                    value={tallas[talla]}
                    onChange={(e) => setTallas((prev) => ({ ...prev, [talla]: Number(e.target.value) }))}
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="two-col">
            <PhotoUploader
              productoId={savedProductoId}
              tipo="frente"
              currentUrl={fotos.frente}
              onUploaded={(url) => setFotos((prev) => ({ ...prev, frente: url }))}
            />
            <PhotoUploader
              productoId={savedProductoId}
              tipo="espalda"
              currentUrl={fotos.espalda}
              onUploaded={(url) => setFotos((prev) => ({ ...prev, espalda: url }))}
            />
          </div>
        </>
      )}

      {error && <div className="auth-error">{error}</div>}
      <div className="modal-actions">
        <button className="btn ghost" onClick={onClose}>
          {savedProductoId && !isEdit ? 'Listo' : 'Cancelar'}
        </button>
        <button className="btn primary" onClick={handleSubmit} disabled={saving || !nombre.trim()}>
          {saving ? 'Guardando…' : savedProductoId ? 'Guardar cambios' : 'Crear producto'}
        </button>
      </div>
    </Modal>
  )
}
