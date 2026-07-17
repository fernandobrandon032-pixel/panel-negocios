import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabaseClient'

export function useClientes() {
  return useQuery({
    queryKey: ['tp', 'clientes'],
    queryFn: async () => {
      const { data, error } = await supabase.from('tp_clientes').select('*').order('nombre')
      if (error) throw error
      return data
    },
  })
}

export function useCreateCliente() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { nombre: string; contacto?: string; notas?: string }) => {
      const { error } = await supabase.from('tp_clientes').insert(input)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tp', 'clientes'] }),
  })
}

export function useUpdateCliente() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { id: string; nombre: string; contacto?: string; notas?: string }) => {
      const { id, ...fields } = input
      const { error } = await supabase.from('tp_clientes').update(fields).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tp', 'clientes'] }),
  })
}

export function useDeleteCliente() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tp_clientes').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tp', 'clientes'] }),
  })
}
