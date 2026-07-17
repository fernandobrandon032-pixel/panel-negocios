import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabaseClient'

function currentMonthISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

export { currentMonthISO }

export function usePresupuestoProgreso() {
  return useQuery({
    queryKey: ['fz', 'presupuestos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fz_presupuesto_progreso')
        .select('*')
        .eq('mes', currentMonthISO())
        .order('categoria')
      if (error) throw error
      return data
    },
  })
}

export function useUpsertPresupuesto() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { categoria: string; limite: number }) => {
      const { error } = await supabase
        .from('fz_presupuestos')
        .upsert({ categoria: input.categoria, limite: input.limite, mes: currentMonthISO() }, { onConflict: 'user_id,categoria,mes' })
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['fz', 'presupuestos'] }),
  })
}

export function useDeletePresupuesto() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('fz_presupuestos').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['fz', 'presupuestos'] }),
  })
}
