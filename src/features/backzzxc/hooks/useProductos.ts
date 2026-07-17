import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabaseClient'
import type { BzProducto, BzProductoFoto, BzProductoTalla, CorteEnum, TallaEnum } from '../../../lib/database.types'

export interface ProductoConDetalle extends BzProducto {
  bz_producto_tallas: BzProductoTalla[]
  bz_producto_fotos: BzProductoFoto[]
}

const TALLAS: TallaEnum[] = ['S', 'M', 'L', 'XL', 'XXL']

export const PRECIO_DEFAULT_POR_CORTE: Record<CorteEnum, number> = {
  'Corte Recto': 250,
  'Corte Oversize': 330,
  'Corte Niño': 230,
  'Corte Polo': 0,
}

export function useProductos() {
  return useQuery({
    queryKey: ['bz', 'productos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bz_productos')
        .select('*, bz_producto_tallas(*), bz_producto_fotos(*)')
        .order('nombre')
      if (error) throw error
      return data as ProductoConDetalle[]
    },
  })
}

export function useCreateProducto() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { nombre: string; corte: CorteEnum; categoria: string; precio: number; notas?: string }) => {
      const { data: producto, error } = await supabase.from('bz_productos').insert(input).select().single()
      if (error) throw error

      const { error: tallasError } = await supabase
        .from('bz_producto_tallas')
        .insert(TALLAS.map((talla) => ({ producto_id: producto.id, talla, cantidad: 0 })))
      if (tallasError) throw tallasError

      return producto
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bz', 'productos'] }),
  })
}

export function useUpdateProducto() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      id: string
      nombre: string
      corte: CorteEnum
      categoria: string
      precio: number
      notas?: string
      tallas: Record<TallaEnum, number>
    }) => {
      const { id, tallas, ...productoFields } = input
      const { error } = await supabase.from('bz_productos').update(productoFields).eq('id', id)
      if (error) throw error

      for (const talla of TALLAS) {
        const { error: tallaError } = await supabase
          .from('bz_producto_tallas')
          .update({ cantidad: tallas[talla] ?? 0 })
          .eq('producto_id', id)
          .eq('talla', talla)
        if (tallaError) throw tallaError
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bz', 'productos'] }),
  })
}

export function useDeleteProducto() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('bz_productos').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bz', 'productos'] }),
  })
}

// Fusiona `mergedId` dentro de `survivorId`: suma cantidades por talla, mueve las fotos que al
// sobreviviente le falten, y borra el producto fusionado. Acción explícita del usuario, nunca
// automática por coincidencia de nombre.
export function useFusionarProductos() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ survivorId, mergedId }: { survivorId: string; mergedId: string }) => {
      const { data: mergedTallas, error: tallasError } = await supabase
        .from('bz_producto_tallas')
        .select('*')
        .eq('producto_id', mergedId)
      if (tallasError) throw tallasError

      for (const mt of mergedTallas ?? []) {
        const { data: survivorTalla, error: stError } = await supabase
          .from('bz_producto_tallas')
          .select('*')
          .eq('producto_id', survivorId)
          .eq('talla', mt.talla)
          .single()
        if (stError) throw stError

        const { error: updError } = await supabase
          .from('bz_producto_tallas')
          .update({ cantidad: survivorTalla.cantidad + mt.cantidad })
          .eq('id', survivorTalla.id)
        if (updError) throw updError
      }

      const { data: mergedFotos, error: fotosError } = await supabase
        .from('bz_producto_fotos')
        .select('*')
        .eq('producto_id', mergedId)
      if (fotosError) throw fotosError

      const { data: survivorFotos, error: survivorFotosError } = await supabase
        .from('bz_producto_fotos')
        .select('*')
        .eq('producto_id', survivorId)
      if (survivorFotosError) throw survivorFotosError

      for (const foto of mergedFotos ?? []) {
        const yaExiste = (survivorFotos ?? []).some((f) => f.tipo === foto.tipo)
        if (!yaExiste) {
          const { error: moveError } = await supabase
            .from('bz_producto_fotos')
            .update({ producto_id: survivorId })
            .eq('id', foto.id)
          if (moveError) throw moveError
        }
      }

      const { error: deleteError } = await supabase.from('bz_productos').delete().eq('id', mergedId)
      if (deleteError) throw deleteError
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bz', 'productos'] }),
  })
}
