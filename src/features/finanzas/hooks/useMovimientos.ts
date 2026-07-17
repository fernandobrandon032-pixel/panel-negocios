import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabaseClient'
import type { MovimientoTipoEnum } from '../../../lib/database.types'

const CATEGORIAS_QUERY_KEYS = [
  ['fz', 'movimientos'],
  ['fz', 'presupuestos'],
  ['fz', 'ahorro'],
]

export function useMovimientos() {
  return useQuery({
    queryKey: ['fz', 'movimientos'],
    queryFn: async () => {
      const { data, error } = await supabase.from('fz_movimientos').select('*').order('fecha', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

function invalidateAll(queryClient: ReturnType<typeof useQueryClient>) {
  for (const key of CATEGORIAS_QUERY_KEYS) queryClient.invalidateQueries({ queryKey: key })
}

export function useCreateMovimiento() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { tipo: MovimientoTipoEnum; categoria: string; monto: number; descripcion?: string; fecha: string }) => {
      const { error } = await supabase.from('fz_movimientos').insert(input)
      if (error) throw error
    },
    onSuccess: () => invalidateAll(queryClient),
  })
}

export function useDeleteMovimiento() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('fz_movimientos').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => invalidateAll(queryClient),
  })
}
