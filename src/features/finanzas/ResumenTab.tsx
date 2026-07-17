import { HeroRevenueCard } from '../../components/shell/HeroRevenueCard'
import { MetricCard, MetricGrid } from '../../components/shell/MetricCard'
import { EmptyState } from '../../components/shared/EmptyState'
import { formatCurrency } from '../../lib/formatters'
import { useAhorroAcumulado, useMetaAhorro } from './hooks/useAhorro'
import { useMovimientos } from './hooks/useMovimientos'

export function ResumenTab() {
  const { data: movimientos, isLoading: loadingMovimientos } = useMovimientos()
  const { data: meta, isLoading: loadingMeta } = useMetaAhorro()
  const { data: acumulado, isLoading: loadingAcumulado } = useAhorroAcumulado()

  if (loadingMovimientos || loadingMeta || loadingAcumulado) return <EmptyState message="Cargando resumen…" />

  const inicioMes = new Date()
  inicioMes.setDate(1)
  inicioMes.setHours(0, 0, 0, 0)

  const delMes = (movimientos ?? []).filter((m) => new Date(m.fecha) >= inicioMes)
  const gastosDelMes = delMes.filter((m) => m.tipo === 'gasto').reduce((sum, m) => sum + m.monto, 0)
  const ingresosDelMes = delMes.filter((m) => m.tipo === 'ingreso').reduce((sum, m) => sum + m.monto, 0)
  const balance = ingresosDelMes - gastosDelMes

  return (
    <>
      <HeroRevenueCard
        label="Balance de este mes"
        value={formatCurrency(balance)}
        sub={`Ingresos ${formatCurrency(ingresosDelMes)} · Gastos ${formatCurrency(gastosDelMes)}`}
      />
      <MetricGrid>
        <MetricCard label="Movimientos este mes" value={String(delMes.length)} />
        {meta && (
          <MetricCard
            label={`Meta: ${meta.nombre}`}
            value={`${(((acumulado ?? 0) / meta.monto_objetivo) * 100).toFixed(0)}%`}
          />
        )}
      </MetricGrid>
    </>
  )
}
