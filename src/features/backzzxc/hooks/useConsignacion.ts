import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabaseClient'
import type { TallaEnum } from '../../../lib/database.types'

export function useConsignaciones() {
  return useQuery({
    queryKey: ['bz', 'consignaciones'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bz_consignaciones')
        .select('*, bz_consignacion_piezas(*, bz_productos(nombre))')
        .order('fecha', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

export function useCreateConsignacion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { socio: string; ubicacion?: string; comision_pct: number; fecha: string; notas?: string }) => {
      const { error } = await supabase.from('bz_consignaciones').insert(input)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bz', 'consignaciones'] }),
  })
}

export function useAgregarPieza() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { consignacion_id: string; producto_id: string; talla: TallaEnum; cantidad: number }) => {
      const { error } = await supabase.from('bz_consignacion_piezas').insert(input)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bz', 'consignaciones'] }),
  })
}

export function useMarcarPiezaVendida() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { piezaId: string; precioVenta: number }) => {
      const { data, error } = await supabase.rpc('marcar_pieza_vendida', {
        p_pieza_id: input.piezaId,
        p_precio_venta: input.precioVenta,
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bz', 'consignaciones'] })
      queryClient.invalidateQueries({ queryKey: ['bz', 'productos'] })
      queryClient.invalidateQueries({ queryKey: ['bz', 'ventas'] })
    },
  })
}

export function useMarcarPiezaDevuelta() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (piezaId: string) => {
      const { error } = await supabase
        .from('bz_consignacion_piezas')
        .update({ estado: 'devuelta', fecha_estado: new Date().toISOString() })
        .eq('id', piezaId)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bz', 'consignaciones'] }),
  })
}
