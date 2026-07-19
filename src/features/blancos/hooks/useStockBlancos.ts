import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabaseClient'
import type { CorteEnum, TallaEnum } from '../../../lib/database.types'

const QUERY_KEY = ['stock_blancos']
const TALLAS: TallaEnum[] = ['S', 'M', 'L', 'XL', 'XXL', 'XXXL']

export function useStockBlancos() {
  const queryClient = useQueryClient()

  // Este stock es compartido entre Backzzxc y TurboPrints95 — se suscribe a cambios en
  // Postgres para que ambos negocios vean el número actualizado sin tener que recargar.
  useEffect(() => {
    const channel = supabase
      .channel('stock_blancos_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stock_blancos' }, () => {
        queryClient.invalidateQueries({ queryKey: QUERY_KEY })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])

  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase.from('stock_blancos').select('*').order('corte').order('color').order('talla')
      if (error) throw error
      return data
    },
  })
}

export function useSetCantidadBlanco() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { corte: CorteEnum; color: string; talla: TallaEnum; cantidad: number }) => {
      const { error } = await supabase
        .from('stock_blancos')
        .upsert(input, { onConflict: 'corte,color,talla' })
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}

export function useAgregarColorBlanco() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { corte: CorteEnum; color: string }) => {
      const { error } = await supabase
        .from('stock_blancos')
        .insert(TALLAS.map((talla) => ({ corte: input.corte, color: input.color, talla, cantidad: 0 })))
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}
