import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabaseClient'
import type { VarianteTipoEnum } from '../../../lib/database.types'

export function useStock() {
  return useQuery({
    queryKey: ['tp', 'stock'],
    queryFn: async () => {
      const { data, error } = await supabase.from('tp_stock').select('*').order('nombre')
      if (error) throw error
      return data
    },
  })
}

export function useCreateStock() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      nombre: string
      variante_label: string
      tipo_variante: VarianteTipoEnum
      precio: number
      costo?: number
      cantidad: number
    }) => {
      const { error } = await supabase.from('tp_stock').insert(input)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tp', 'stock'] }),
  })
}

export function useUpdateStock() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      id: string
      nombre: string
      variante_label: string
      tipo_variante: VarianteTipoEnum
      precio: number
      costo?: number
      cantidad: number
    }) => {
      const { id, ...fields } = input
      const { error } = await supabase.from('tp_stock').update(fields).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tp', 'stock'] }),
  })
}

export function useDeleteStock() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tp_stock').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tp', 'stock'] }),
  })
}

// Playeras de carros: viven físicamente en el stock de Backzzxc (categoria='Carros') y se
// cross-listan aquí en modo solo-lectura porque también se venden por mayoreo desde ahí.
export function useCarrosStock() {
  return useQuery({
    queryKey: ['tp', 'carros'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bz_productos')
        .select('*, bz_producto_tallas(*)')
        .eq('categoria', 'Carros')
        .order('nombre')
      if (error) throw error
      return data
    },
  })
}
