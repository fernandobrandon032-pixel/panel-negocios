import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabaseClient'

// Total de piezas vendidas por producto (histórico completo), para poder ordenar el catálogo
// de más vendido a menos vendido.
export function useVentasPorProducto() {
  return useQuery({
    queryKey: ['bz', 'ventas_por_producto'],
    queryFn: async () => {
      const { data, error } = await supabase.from('bz_venta_items').select('producto_id, cantidad')
      if (error) throw error

      const totales = new Map<string, number>()
      for (const item of data ?? []) {
        totales.set(item.producto_id, (totales.get(item.producto_id) ?? 0) + item.cantidad)
      }
      return totales
    },
  })
}
