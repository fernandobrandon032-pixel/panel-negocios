import type { BzCostoBlank, BzCostoInsumo, CorteEnum, TallaEnum } from './database.types'

export type DisenoTamano = 'grande' | 'chico'

export interface CostoPlayeraDesglose {
  blank: number
  dtf: number
  bolsa: number
  cintaTermica: number
  electricidad: number
  total: number
}

function valorInsumo(insumos: BzCostoInsumo[], clave: string): number {
  return insumos.find((i) => i.clave === clave)?.valor ?? 0
}

// Costo estimado por playera, a partir de los insumos y precios de blank editables por el
// usuario en la pestaña Costos. Es una función pura (sin acceso a la BD) para que la fórmula
// se pueda ajustar libremente sin tocar el esquema.
export function calcularCostoPlayera(params: {
  corte: CorteEnum
  talla: TallaEnum
  disenoTamano: DisenoTamano
  insumos: BzCostoInsumo[]
  blanks: BzCostoBlank[]
  // Si se da un color, usa ese precio exacto. Si no (por ejemplo, para una estimación general
  // donde no sabemos el color del blank), promedia los colores disponibles para ese corte+talla
  // — el promedio es solo un fallback de estimación, nunca lo que se guarda como dato fuente.
  color?: string
}): CostoPlayeraDesglose {
  const { corte, talla, disenoTamano, insumos, blanks, color } = params

  const candidatos = blanks.filter((b) => b.corte === corte && b.talla === talla)
  const blank = color
    ? (candidatos.find((b) => b.color.toLowerCase() === color.toLowerCase())?.precio ?? 0)
    : candidatos.length
      ? candidatos.reduce((sum, b) => sum + b.precio, 0) / candidatos.length
      : 0

  // DTF ya viene como costo directo en pesos por playera (más fácil de leer/ajustar que
  // metro/ratio) — distinto según qué tan grande es el diseño.
  const dtf =
    disenoTamano === 'grande' ? valorInsumo(insumos, 'dtf_costo_diseno_grande') : valorInsumo(insumos, 'dtf_costo_diseno_chico')

  const bolsa = valorInsumo(insumos, 'bolsa_unidad')

  // La cinta térmica dura mucho (se compra cada ~6 meses), así que su costo por playera se
  // prorratea entre las playeras estimadas que salen en ese periodo.
  const cintaTermicaCosto = valorInsumo(insumos, 'cinta_termica_costo')
  const cintaTermicaPlayerasEstimadas = valorInsumo(insumos, 'cinta_termica_playeras_estimadas') || 1
  const cintaTermica = cintaTermicaCosto / cintaTermicaPlayerasEstimadas

  const planchaGrandeWatts = valorInsumo(insumos, 'plancha_grande_watts')
  const planchaChicaWatts = valorInsumo(insumos, 'plancha_chica_watts')
  const minutosGrande = valorInsumo(insumos, 'lote_minutos_plancha_grande')
  const minutosChica = valorInsumo(insumos, 'lote_minutos_plancha_chica')
  const tarifaKwh = valorInsumo(insumos, 'tarifa_cfe_kwh')
  const playerasPorLote = valorInsumo(insumos, 'playeras_por_lote') || 1

  const kwhLote =
    ((planchaGrandeWatts * minutosGrande) / 60 + (planchaChicaWatts * minutosChica) / 60) / 1000
  const electricidad = (kwhLote * tarifaKwh) / playerasPorLote

  const total = blank + dtf + bolsa + cintaTermica + electricidad

  return { blank, dtf, bolsa, cintaTermica, electricidad, total }
}
