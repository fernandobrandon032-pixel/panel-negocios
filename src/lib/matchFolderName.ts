// Normaliza nombres para emparejar carpetas de fotos con productos: minúsculas, sin acentos,
// sin el prefijo "NN - " que usamos para ordenar carpetas, y sin símbolos raros.
export function normalizeName(raw: string): string {
  return raw
    .replace(/^\d+\s*-\s*/, '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

export function findBestMatch<T extends { id: string; nombre: string }>(folderName: string, productos: T[]): T | null {
  const target = normalizeName(folderName)
  if (!target) return null

  const exact = productos.find((p) => normalizeName(p.nombre) === target)
  if (exact) return exact

  const contained = productos.find((p) => {
    const n = normalizeName(p.nombre)
    return n.includes(target) || target.includes(n)
  })
  return contained ?? null
}
