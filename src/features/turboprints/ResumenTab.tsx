import { HeroRevenueCard } from '../../components/shell/HeroRevenueCard'
import { MetricCard, MetricGrid } from '../../components/shell/MetricCard'
import { EmptyState } from '../../components/shared/EmptyState'
import { formatCurrency } from '../../lib/formatters'
import { useClientes } from './hooks/useClientes'
import { usePedidos } from './hooks/usePedidos'
import { useStock } from './hooks/useStock'

export function ResumenTab() {
  const { data: pedidos, isLoading: loadingPedidos } = usePedidos()
  const { data: stock, isLoading: loadingStock } = useStock()
  const { data: clientes, isLoading: loadingClientes } = useClientes()

  if (loadingPedidos || loadingStock || loadingClientes) return <EmptyState message="Cargando resumen…" />

  const inicioMes = new Date()
  inicioMes.setDate(1)
  inicioMes.setHours(0, 0, 0, 0)

  const pedidosDelMes = (pedidos ?? []).filter((p) => new Date(p.fecha) >= inicioMes)
  const ingresosDelMes = pedidosDelMes.reduce((sum, p) => sum + p.precio, 0)
  const pendientes = (pedidos ?? []).filter((p) => p.estatus === 'Pendiente' || p.estatus === 'En proceso')

  return (
    <>
      <HeroRevenueCard
        label="Ingresos por pedidos este mes"
        value={formatCurrency(ingresosDelMes)}
        sub={`${pedidosDelMes.length} pedido${pedidosDelMes.length === 1 ? '' : 's'}`}
      />
      <MetricGrid>
        <MetricCard label="Pedidos pendientes" value={String(pendientes.length)} />
        <MetricCard label="Productos en stock propio" value={String(stock?.length ?? 0)} />
        <MetricCard label="Clientes" value={String(clientes?.length ?? 0)} />
      </MetricGrid>
    </>
  )
}
