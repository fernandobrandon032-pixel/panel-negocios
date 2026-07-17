import { HeroRevenueCard } from '../../components/shell/HeroRevenueCard'
import { MetricCard, MetricGrid } from '../../components/shell/MetricCard'
import { EmptyState } from '../../components/shared/EmptyState'
import { formatCurrency } from '../../lib/formatters'
import { useClientes } from './hooks/useClientes'
import { useProductos } from './hooks/useProductos'
import { useVentas } from './hooks/useVentas'

interface VentaItemJoined {
  cantidad: number
  precio_unitario: number
}

export function ResumenTab() {
  const { data: productos, isLoading: loadingProductos } = useProductos()
  const { data: ventas, isLoading: loadingVentas } = useVentas()
  const { data: clientes, isLoading: loadingClientes } = useClientes()

  if (loadingProductos || loadingVentas || loadingClientes) return <EmptyState message="Cargando resumen…" />

  const valorInventario = (productos ?? []).reduce((sum, p) => {
    const piezas = p.bz_producto_tallas.reduce((s, t) => s + t.cantidad, 0)
    return sum + piezas * p.precio
  }, 0)

  const inicioMes = new Date()
  inicioMes.setDate(1)
  inicioMes.setHours(0, 0, 0, 0)

  const ventasDelMes = (ventas ?? []).filter((v) => new Date(v.fecha) >= inicioMes)
  const ingresosDelMes = ventasDelMes.reduce((sum, v) => {
    const items = (v.bz_venta_items ?? []) as VentaItemJoined[]
    return sum + items.reduce((s, i) => s + i.cantidad * i.precio_unitario, 0)
  }, 0)

  const totalPiezas = (productos ?? []).reduce(
    (sum, p) => sum + p.bz_producto_tallas.reduce((s, t) => s + t.cantidad, 0),
    0
  )

  return (
    <>
      <HeroRevenueCard
        label="Ingresos este mes"
        value={formatCurrency(ingresosDelMes)}
        sub={`${ventasDelMes.length} venta${ventasDelMes.length === 1 ? '' : 's'} registradas`}
      />
      <MetricGrid>
        <MetricCard label="Modelos en catálogo" value={String(productos?.length ?? 0)} />
        <MetricCard label="Piezas en stock" value={String(totalPiezas)} />
        <MetricCard label="Valor de inventario" value={formatCurrency(valorInventario)} />
        <MetricCard label="Clientes" value={String(clientes?.length ?? 0)} />
      </MetricGrid>
    </>
  )
}
