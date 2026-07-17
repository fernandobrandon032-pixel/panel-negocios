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
}): CostoPlayeraDesglose {
  const { corte, talla, disenoTamano, insumos, blanks } = params

  const blank = blanks.find((b) => b.corte === corte && b.talla === talla)?.precio ?? 0

  const dtfPorMetro = valorInsumo(insumos, 'dtf_por_metro')
  const disenosPorMetro =
    disenoTamano === 'grande'
      ? valorInsumo(insumos, 'dtf_disenos_grandes_por_metro')
      : valorInsumo(insumos, 'dtf_disenos_chicos_por_metro')
  const dtf = disenosPorMetro > 0 ? dtfPorMetro / disenosPorMetro : 0

  const bolsa = valorInsumo(insumos, 'bolsa_unidad')
  const cintaTermica = valorInsumo(insumos, 'cinta_termica_unidad')

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
