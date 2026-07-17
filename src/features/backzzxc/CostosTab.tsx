import { useState } from 'react'
import { EmptyState } from '../../components/shared/EmptyState'
import { useToast } from '../../contexts/ToastContext'
import { formatCurrency } from '../../lib/formatters'
import { calcularCostoPlayera, type DisenoTamano } from '../../lib/costCalc'
import type { CorteEnum, TallaEnum } from '../../lib/database.types'
import { useCostosBlank, useCostosInsumos, useUpdateCostoInsumo, useUpsertCostoBlank } from './hooks/useCostos'

const CORTES: CorteEnum[] = ['Corte Recto', 'Corte Oversize', 'Corte Polo', 'Corte Niño']
const TALLAS: TallaEnum[] = ['S', 'M', 'L', 'XL', 'XXL']

function InsumoRow({ insumo }: { insumo: { id: string; clave: string; valor: number; unidad: string | null; notas: string | null } }) {
  const [valor, setValor] = useState(insumo.valor)
  const update = useUpdateCostoInsumo()
  const showToast = useToast()

  return (
    <tr>
      <td>
        {insumo.clave}
        {insumo.notas && <div style={{ fontSize: 11, opacity: 0.5 }}>{insumo.notas}</div>}
      </td>
      <td>{insumo.unidad}</td>
      <td>
        <input
          type="number"
          style={{ width: 100 }}
          value={valor}
          onChange={(e) => setValor(Number(e.target.value))}
          onBlur={async () => {
            if (valor !== insumo.valor) {
              await update.mutateAsync({ id: insumo.id, valor })
              showToast('Costo actualizado')
            }
          }}
        />
      </td>
    </tr>
  )
}

function BlankCell({ corte, talla, precio }: { corte: CorteEnum; talla: TallaEnum; precio?: number }) {
  const [valor, setValor] = useState(precio ?? 0)
  const upsert = useUpsertCostoBlank()
  const showToast = useToast()

  return (
    <input
      type="number"
      style={{ width: 80 }}
      value={valor}
      placeholder="—"
      onChange={(e) => setValor(Number(e.target.value))}
      onBlur={async () => {
        if (valor !== (precio ?? 0) && valor > 0) {
          await upsert.mutateAsync({ corte, talla, precio: valor })
          showToast('Precio de blank actualizado')
        }
      }}
    />
  )
}

export function CostosTab() {
  const { data: insumos, isLoading: loadingInsumos } = useCostosInsumos()
  const { data: blanks, isLoading: loadingBlanks } = useCostosBlank()

  const [corteCalc, setCorteCalc] = useState<CorteEnum>('Corte Recto')
  const [tallaCalc, setTallaCalc] = useState<TallaEnum>('M')
  const [disenoCalc, setDisenoCalc] = useState<DisenoTamano>('grande')

  if (loadingInsumos || loadingBlanks) return <EmptyState message="Cargando costos…" />

  const desglose = calcularCostoPlayera({
    corte: corteCalc,
    talla: tallaCalc,
    disenoTamano: disenoCalc,
    insumos: insumos ?? [],
    blanks: blanks ?? [],
  })

  return (
    <>
      <div className="section-row">
        <h2>Calculadora de costo por playera</h2>
      </div>
      <div className="two-col" style={{ marginBottom: 14 }}>
        <div className="field">
          <label>Corte</label>
          <select value={corteCalc} onChange={(e) => setCorteCalc(e.target.value as CorteEnum)}>
            {CORTES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Talla</label>
          <select value={tallaCalc} onChange={(e) => setTallaCalc(e.target.value as TallaEnum)}>
            {TALLAS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="sale-type-toggle">
        <button className={disenoCalc === 'grande' ? 'active' : ''} onClick={() => setDisenoCalc('grande')}>
          Diseño grande
        </button>
        <button className={disenoCalc === 'chico' ? 'active' : ''} onClick={() => setDisenoCalc('chico')}>
          Diseño chico
        </button>
      </div>
      <div className="note-box">
        Blank: {formatCurrency(desglose.blank)} · DTF: {formatCurrency(desglose.dtf)} · Bolsa:{' '}
        {formatCurrency(desglose.bolsa)} · Cinta térmica: {formatCurrency(desglose.cintaTermica)} · Electricidad:{' '}
        {formatCurrency(desglose.electricidad)}
        <br />
        <strong style={{ fontSize: 16 }}>Costo total estimado: {formatCurrency(desglose.total)}</strong>
      </div>

      <div className="section-row">
        <h2>Precios de playera en blanco (Euro Cotton)</h2>
      </div>
      <table style={{ marginBottom: 24 }}>
        <thead>
          <tr>
            <th>Corte</th>
            {TALLAS.map((t) => (
              <th key={t}>{t}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {CORTES.map((corte) => (
            <tr key={corte}>
              <td>{corte}</td>
              {TALLAS.map((talla) => (
                <td key={talla}>
                  <BlankCell corte={corte} talla={talla} precio={blanks?.find((b) => b.corte === corte && b.talla === talla)?.precio} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="section-row">
        <h2>Insumos</h2>
      </div>
      <table>
        <thead>
          <tr>
            <th>Insumo</th>
            <th>Unidad</th>
            <th>Valor</th>
          </tr>
        </thead>
        <tbody>
          {insumos?.map((i) => (
            <InsumoRow key={i.id} insumo={i} />
          ))}
        </tbody>
      </table>
    </>
  )
}
