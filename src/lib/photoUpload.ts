import { supabase } from './supabaseClient'
import type { FotoTipoEnum } from './database.types'

const BUCKET = 'productos'
const MAX_DIMENSION = 1600
const JPEG_QUALITY = 0.82

async function toJpegBlob(file: File): Promise<Blob> {
  const isHeic = /\.hei[cf]$/i.test(file.name) || file.type === 'image/heic' || file.type === 'image/heif'
  const source: Blob = isHeic
    ? await (async () => {
        const heic2any = (await import('heic2any')).default
        const result = await heic2any({ blob: file, toType: 'image/jpeg', quality: JPEG_QUALITY })
        return Array.isArray(result) ? result[0] : result
      })()
    : file

  const bitmap = await createImageBitmap(source)
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('No se pudo procesar la imagen en este navegador')
  ctx.drawImage(bitmap, 0, 0, width, height)

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('No se pudo comprimir la imagen'))),
      'image/jpeg',
      JPEG_QUALITY
    )
  })
}

// Convierte (HEIC incluido), comprime a ~1600px y sube la foto de un producto de Backzzxc,
// reemplazando la anterior si ya existía (misma ruta fija por producto+tipo).
export async function uploadProductoFoto(productoId: string, tipo: FotoTipoEnum, file: File): Promise<string> {
  const jpeg = await toJpegBlob(file)
  const path = `backzzxc/${productoId}/${tipo}.jpg`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, jpeg, { upsert: true, contentType: 'image/jpeg' })
  if (uploadError) throw uploadError

  const { error: dbError } = await supabase
    .from('bz_producto_fotos')
    .upsert({ producto_id: productoId, tipo, storage_path: path }, { onConflict: 'producto_id,tipo' })
  if (dbError) throw dbError

  return getProductoFotoUrl(path)
}

export function getProductoFotoUrl(storagePath: string): string {
  return supabase.storage.from(BUCKET).getPublicUrl(storagePath).data.publicUrl
}
