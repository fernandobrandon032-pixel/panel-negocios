import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabaseClient'
import type { ProspectoEstatusEnum } from '../../../lib/database.types'

export function useProspectos() {
  return useQuery({
    queryKey: ['tp', 'prospectos'],
    queryFn: async () => {
      const { data, error } = await supabase.from('tp_prospectos').select('*').order('fecha', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

export function useCreateProspecto() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { nombre: string; contacto?: string; interes?: string; estatus: ProspectoEstatusEnum; fecha: string }) => {
      const { error } = await supabase.from('tp_prospectos').insert(input)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tp', 'prospectos'] }),
  })
}

export function useUpdateProspecto() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { id: string; nombre: string; contacto?: string; interes?: string; estatus: ProspectoEstatusEnum; fecha: string }) => {
      const { id, ...fields } = input
      const { error } = await supabase.from('tp_prospectos').update(fields).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tp', 'prospectos'] }),
  })
}

export function useDeleteProspecto() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tp_prospectos').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tp', 'prospectos'] }),
  })
}
