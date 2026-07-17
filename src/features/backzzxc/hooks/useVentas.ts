import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabaseClient'
import type { TallaEnum } from '../../../lib/database.types'

export interface VentaItemInput {
  producto_id: string
  talla: TallaEnum
  cantidad: number
  precio_unitario: number
}

export function useVentas() {
  return useQuery({
    queryKey: ['bz', 'ventas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bz_ventas')
        .select('*, bz_clientes(nombre), bz_venta_items(*, bz_productos(nombre))')
        .order('fecha', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

export function useRegistrarVenta() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { clienteId: string | null; items: VentaItemInput[]; notas?: string }) => {
      const { data, error } = await supabase.rpc('registrar_venta', {
        p_cliente_id: input.clienteId,
        p_items: input.items,
        p_notas: input.notas ?? null,
        p_origen: 'directa',
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bz', 'ventas'] })
      queryClient.invalidateQueries({ queryKey: ['bz', 'productos'] })
      queryClient.invalidateQueries({ queryKey: ['bz', 'clientes'] })
    },
  })
}
