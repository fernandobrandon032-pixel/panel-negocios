import { useMemo, useRef, useState } from 'react'
import { Modal } from '../../../components/shared/Modal'
import { useToast } from '../../../contexts/ToastContext'
import { findBestMatch } from '../../../lib/matchFolderName'
import { uploadProductoFoto } from '../../../lib/photoUpload'
import type { ProductoConDetalle } from '../hooks/useProductos'

interface Grupo {
  folderName: string
  frente?: File
  espalda?: File
  productoId: string | null
}

function baseName(file: File): string {
  const parts = file.webkitRelativePath.split('/')
  return parts[parts.length - 1].toLowerCase()
}

function folderOf(file: File): string {
  const parts = file.webkitRelativePath.split('/')
  return parts.length >= 2 ? parts[parts.length - 2] : parts[0]
}

export function BulkUploadModal({ productos, onClose }: { productos: ProductoConDetalle[]; onClose: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [grupos, setGrupos] = useState<Grupo[]>([])
  const [subiendo, setSubiendo] = useState(false)
  const [progreso, setProgreso] = useState({ hecho: 0, total: 0 })
  const showToast = useToast()

  const sinEmparejar = useMemo(() => grupos.filter((g) => !g.productoId).length, [grupos])

  function handleFiles(fileList: FileList | null) {
    if (!fileList || !fileList.length) return
    const byFolder = new Map<string, Grupo>()

    for (const file of Array.from(fileList)) {
      const name = baseName(file)
      const folder = folderOf(file)
      if (!name.startsWith('frente') && !name.startsWith('espalda')) continue
      if (name.includes('_alterna')) continue

      const grupo = byFolder.get(folder) ?? { folderName: folder, productoId: null }
      if (name.startsWith('frente')) grupo.frente = file
      if (name.startsWith('espalda')) grupo.espalda = file
      byFolder.set(folder, grupo)
    }

    const nuevos = Array.from(byFolder.values()).map((g) => ({
      ...g,
      productoId: findBestMatch(g.folderName, productos)?.id ?? null,
    }))
    nuevos.sort((a, b) => a.folderName.localeCompare(b.folderName))
    setGrupos(nuevos)
  }

  async function handleSubirTodo() {
    const listos = grupos.filter((g) => g.productoId)
    setSubiendo(true)
    setProgreso({ hecho: 0, total: listos.length })

    let ok = 0
    for (const g of listos) {
      try {
        if (g.frente) await uploadProductoFoto(g.productoId!, 'frente', g.frente)
        if (g.espalda) await uploadProductoFoto(g.productoId!, 'espalda', g.espalda)
        ok++
      } catch {
        // seguimos con los demás aunque uno falle
      }
      setProgreso((p) => ({ ...p, hecho: p.hecho + 1 }))
    }

    setSubiendo(false)
    showToast(`Listo: ${ok} de ${listos.length} productos actualizados`)
    onClose()
  }

  return (
    <Modal
      title="Carga masiva de fotos"
      sub="Selecciona la carpeta 'Catalogo exportado' completa. Cada subcarpeta se empareja con su producto por nombre."
      onClose={onClose}
      wide
    >
      {!grupos.length ? (
        <div className="field">
          <label>Carpeta con las fotos organizadas</label>
          <input
            ref={inputRef}
            type="file"
            // @ts-expect-error -- atributo no estándar de selección de carpeta, soportado en Chrome/Edge/Opera
            webkitdirectory=""
            directory=""
            multiple
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>
      ) : (
        <>
          <div className="note-box">
            {grupos.length} carpetas encontradas · {grupos.length - sinEmparejar} emparejadas automáticamente
            {sinEmparejar > 0 && ` · ${sinEmparejar} sin emparejar (elige el producto a mano)`}
          </div>
          <div style={{ maxHeight: 360, overflowY: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Carpeta</th>
                  <th>Fotos</th>
                  <th>Producto</th>
                </tr>
              </thead>
              <tbody>
                {grupos.map((g, i) => (
                  <tr key={g.folderName}>
                    <td>{g.folderName}</td>
                    <td>
                      {g.frente ? 'frente' : '—'} {g.espalda ? '+ espalda' : ''}
                    </td>
                    <td>
                      <select
                        value={g.productoId ?? ''}
                        onChange={(e) =>
                          setGrupos((prev) =>
                            prev.map((row, idx) => (idx === i ? { ...row, productoId: e.target.value || null } : row))
                          )
                        }
                      >
                        <option value="">Sin emparejar — omitir</option>
                        {productos.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.nombre}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {subiendo && (
        <div className="note-box" style={{ marginTop: 14 }}>
          Subiendo… {progreso.hecho} / {progreso.total}
        </div>
      )}

      <div className="modal-actions">
        <button className="btn ghost" onClick={onClose} disabled={subiendo}>
          Cancelar
        </button>
        {grupos.length > 0 && (
          <button className="btn primary" onClick={handleSubirTodo} disabled={subiendo}>
            {subiendo ? 'Subiendo…' : `Subir todo (${grupos.filter((g) => g.productoId).length})`}
          </button>
        )}
      </div>
    </Modal>
  )
}
