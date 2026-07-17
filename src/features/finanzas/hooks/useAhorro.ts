import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabaseClient'

export function useMetaAhorro() {
  return useQuery({
    queryKey: ['fz', 'meta_ahorro'],
    queryFn: async () => {
      const { data, error } = await supabase.from('fz_meta_ahorro').select('*').limit(1).maybeSingle()
      if (error) throw error
      return data
    },
  })
}

export function useUpdateMetaAhorro() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { id: string; nombre: string; monto_objetivo: number }) => {
      const { error } = await supabase
        .from('fz_meta_ahorro')
        .update({ nombre: input.nombre, monto_objetivo: input.monto_objetivo })
        .eq('id', input.id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['fz', 'meta_ahorro'] }),
  })
}

// El avance se calcula de los movimientos categoría "Ahorro" (ingresos - gastos), no de un
// contador aparte, para que nunca se desincronice.
export function useAhorroAcumulado() {
  return useQuery({
    queryKey: ['fz', 'ahorro_acumulado'],
    queryFn: async () => {
      const { data, error } = await supabase.from('fz_movimientos').select('tipo, monto').eq('categoria', 'Ahorro')
      if (error) throw error
      return (data ?? []).reduce((sum, m) => sum + (m.tipo === 'ingreso' ? m.monto : -m.monto), 0)
    },
  })
}
