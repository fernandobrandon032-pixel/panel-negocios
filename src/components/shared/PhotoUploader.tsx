import { useRef, useState } from 'react'
import type { FotoTipoEnum } from '../../lib/database.types'
import { uploadProductoFoto } from '../../lib/photoUpload'

export function PhotoUploader({
  productoId,
  tipo,
  currentUrl,
  onUploaded,
}: {
  productoId: string
  tipo: FotoTipoEnum
  currentUrl?: string
  onUploaded: (url: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(file: File | undefined) {
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const url = await uploadProductoFoto(productoId, tipo, file)
      onUploaded(url)
    } catch {
      setError('No se pudo subir la foto')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="field">
      <label>{tipo === 'frente' ? 'Foto de frente' : 'Foto de espalda'}</label>
      {currentUrl && (
        <img
          src={currentUrl}
          alt={tipo}
          style={{ width: 90, height: 90, objectFit: 'cover', borderRadius: 8, marginBottom: 6 }}
        />
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.heic,.heif"
        capture="environment"
        onChange={(e) => handleFile(e.target.files?.[0])}
        disabled={uploading}
      />
      {uploading && <span style={{ fontSize: 11.5, opacity: 0.6 }}>Subiendo…</span>}
      {error && <span className="auth-error">{error}</span>}
    </div>
  )
}
