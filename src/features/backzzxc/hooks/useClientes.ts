import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabaseClient'
import type { BzCliente, BzClienteStats } from '../../../lib/database.types'

export interface ClienteConStats extends BzCliente {
  stats?: BzClienteStats
}

export function useClientes() {
  return useQuery({
    queryKey: ['bz', 'clientes'],
    queryFn: async () => {
      const [{ data: clientes, error }, { data: stats, error: statsError }] = await Promise.all([
        supabase.from('bz_clientes').select('*').order('nombre'),
        supabase.from('bz_clientes_stats').select('*'),
      ])
      if (error) throw error
      if (statsError) throw statsError

      const statsByCliente = new Map((stats ?? []).map((s) => [s.cliente_id, s]))
      return (clientes ?? []).map((c) => ({ ...c, stats: statsByCliente.get(c.id) })) as ClienteConStats[]
    },
  })
}

export function useCreateCliente() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { nombre: string; contacto?: string; notas?: string }) => {
      const { data, error } = await supabase.from('bz_clientes').insert(input).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bz', 'clientes'] }),
  })
}

export function useUpdateCliente() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { id: string; nombre: string; contacto?: string; notas?: string }) => {
      const { id, ...fields } = input
      const { error } = await supabase.from('bz_clientes').update(fields).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bz', 'clientes'] }),
  })
}

export function useDeleteCliente() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('bz_clientes').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bz', 'clientes'] }),
  })
}
