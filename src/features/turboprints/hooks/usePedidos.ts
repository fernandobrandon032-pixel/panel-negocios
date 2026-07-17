import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabaseClient'
import type { PedidoEstatusEnum, TallaEnum } from '../../../lib/database.types'

export function usePedidos() {
  return useQuery({
    queryKey: ['tp', 'pedidos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tp_pedidos')
        .select('*, tp_clientes(nombre)')
        .order('fecha', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

export function useCreatePedido() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      cliente_id?: string
      diseno: string
      talla?: TallaEnum
      precio: number
      estatus: PedidoEstatusEnum
      fecha: string
    }) => {
      const { error } = await supabase.from('tp_pedidos').insert(input)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tp', 'pedidos'] }),
  })
}

export function useUpdatePedido() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      id: string
      cliente_id?: string
      diseno: string
      talla?: TallaEnum
      precio: number
      estatus: PedidoEstatusEnum
      fecha: string
    }) => {
      const { id, ...fields } = input
      const { error } = await supabase.from('tp_pedidos').update(fields).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tp', 'pedidos'] }),
  })
}

export function useDeletePedido() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tp_pedidos').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tp', 'pedidos'] }),
  })
}
