import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabaseClient'
import type { CorteEnum, TallaEnum } from '../../../lib/database.types'

export function useCostosInsumos() {
  return useQuery({
    queryKey: ['bz', 'costos_insumos'],
    queryFn: async () => {
      const { data, error } = await supabase.from('bz_costos_insumos').select('*').order('clave')
      if (error) throw error
      return data
    },
  })
}

export function useUpdateCostoInsumo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { id: string; valor: number }) => {
      const { error } = await supabase.from('bz_costos_insumos').update({ valor: input.valor }).eq('id', input.id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bz', 'costos_insumos'] }),
  })
}

export function useCostosBlank() {
  return useQuery({
    queryKey: ['bz', 'costos_blank'],
    queryFn: async () => {
      const { data, error } = await supabase.from('bz_costos_blank').select('*').order('corte').order('talla')
      if (error) throw error
      return data
    },
  })
}

export function useUpsertCostoBlank() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { corte: CorteEnum; color: string; talla: TallaEnum; precio: number }) => {
      const { error } = await supabase.from('bz_costos_blank').upsert(input, { onConflict: 'corte,color,talla' })
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bz', 'costos_blank'] }),
  })
}
