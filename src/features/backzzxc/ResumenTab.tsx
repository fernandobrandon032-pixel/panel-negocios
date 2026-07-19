import { useMemo } from 'react'
import { HeroRevenueCard } from '../../components/shell/HeroRevenueCard'
import { MetricCard, MetricGrid } from '../../components/shell/MetricCard'
import { EmptyState } from '../../components/shared/EmptyState'
import { formatCurrency } from '../../lib/formatters'
import { calcularCostoPlayera } from '../../lib/costCalc'
import { useClientes } from './hooks/useClientes'
import { useCostosBlank, useCostosInsumos } from './hooks/useCostos'
import { useProductos } from './hooks/useProductos'
import { useVentas } from './hooks/useVentas'

interface VentaItemJoined {
  producto_id: string
  cantidad: number
  precio_unitario: number
}

interface VentaJoined {
  fecha: string
  bz_venta_items?: VentaItemJoined[]
}

const NOMBRES_MES = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
]

export function ResumenTab() {
  const { data: productos, isLoading: loadingProductos } = useProductos()
  const { data: ventas, isLoading: loadingVentas } = useVentas()
  const { data: clientes, isLoading: loadingClientes } = useClientes()
  const { data: insumos, isLoading: loadingInsumos } = useCostosInsumos()
  const { data: blanks, isLoading: loadingBlanks } = useCostosBlank()

  const loading = loadingProductos || loadingVentas || loadingClientes || loadingInsumos || loadingBlanks

  const porMes = useMemo(() => {
    const hoy = new Date()
    const meses: { etiqueta: string; ingresos: number; ventas: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1)
      meses.push({ etiqueta: `${NOMBRES_MES[d.getMonth()]} ${d.getFullYear().toString().slice(2)}`, ingresos: 0, ventas: 0 })
    }
    for (const v of (ventas ?? []) as VentaJoined[]) {
      const fecha = new Date(v.fecha)
      const idx = meses.findIndex((_, i) => {
        const d = new Date(hoy.getFullYear(), hoy.getMonth() - (5 - i), 1)
        return fecha.getFullYear() === d.getFullYear() && fecha.getMonth() === d.getMonth()
      })
      if (idx === -1) continue
      const items = v.bz_venta_items ?? []
      meses[idx].ventas += 1
      meses[idx].ingresos += items.reduce((s, i) => s + i.cantidad * i.precio_unitario, 0)
    }
    return meses
  }, [ventas])

  const masVendidos = useMemo(() => {
    const totales = new Map<string, number>()
    for (const v of (ventas ?? []) as VentaJoined[]) {
      for (const item of v.bz_venta_items ?? []) {
        totales.set(item.producto_id, (totales.get(item.producto_id) ?? 0) + item.cantidad)
      }
    }
    return Array.from(totales.entries())
      .map(([productoId, cantidad]) => ({
        producto: productos?.find((p) => p.id === productoId),
        cantidad,
      }))
      .filter((x) => x.producto)
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5)
  }, [ventas, productos])

  if (loading) return <EmptyState message="Cargando resumen…" />

  // Valor de inventario = lo que cuesta producir lo que tienes en stock (blank + DTF + bolsa +
  // cinta + electricidad), no el precio de venta — así refleja tu inversión real, no ingresos
  // hipotéticos. Asume diseño "grande" como estimado (el costo real varía según el diseño).
  const valorInventario = (productos ?? []).reduce((sum, p) => {
    return (
      sum +
      p.bz_producto_tallas.reduce((s, t) => {
        if (t.cantidad === 0) return s
        const costo = calcularCostoPlayera({
          corte: p.corte,
          talla: t.talla,
          disenoTamano: 'grande',
          insumos: insumos ?? [],
          blanks: blanks ?? [],
        })
        return s + costo.total * t.cantidad
      }, 0)
    )
  }, 0)

  const inicioMes = new Date()
  inicioMes.setDate(1)
  inicioMes.setHours(0, 0, 0, 0)

  const ventasDelMes = ((ventas ?? []) as VentaJoined[]).filter((v) => new Date(v.fecha) >= inicioMes)
  const ingresosDelMes = ventasDelMes.reduce((sum, v) => {
    const items = v.bz_venta_items ?? []
    return sum + items.reduce((s, i) => s + i.cantidad * i.precio_unitario, 0)
  }, 0)

  const totalPiezas = (productos ?? []).reduce(
    (sum, p) => sum + p.bz_producto_tallas.reduce((s, t) => s + t.cantidad, 0),
    0
  )

  const maxIngresoMes = Math.max(1, ...porMes.map((m) => m.ingresos))

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
        <MetricCard label="Valor de inventario (costo)" value={formatCurrency(valorInventario)} />
        <MetricCard label="Clientes" value={String(clientes?.length ?? 0)} />
      </MetricGrid>

      <div className="section-row">
        <h2>Ventas por mes</h2>
      </div>
      {porMes.every((m) => m.ventas === 0) ? (
        <EmptyState message="Todavía no hay ventas registradas para mostrar tendencia" />
      ) : (
        porMes.map((m) => (
          <div className="bar-row" key={m.etiqueta}>
            <div className="bar-label">
              <span>{m.etiqueta}</span>
              <span>
                {formatCurrency(m.ingresos)} · {m.ventas} venta{m.ventas === 1 ? '' : 's'}
              </span>
            </div>
            <div className="bar-track">
              <div className="bar-fill" style={{ width: `${(m.ingresos / maxIngresoMes) * 100}%` }} />
            </div>
          </div>
        ))
      )}

      <div className="section-row">
        <h2>Más vendidos</h2>
      </div>
      {!masVendidos.length ? (
        <EmptyState message="Todavía no hay ventas para saber cuáles son los favoritos" />
      ) : (
        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th style={{ textAlign: 'center' }}>Piezas vendidas</th>
            </tr>
          </thead>
          <tbody>
            {masVendidos.map(({ producto, cantidad }) => (
              <tr key={producto!.id}>
                <td>{producto!.nombre}</td>
                <td style={{ textAlign: 'center' }}>
                  <span className="pill ok">{cantidad}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  )
}
