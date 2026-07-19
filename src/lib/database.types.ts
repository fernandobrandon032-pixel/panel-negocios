// Tipos escritos a mano siguiendo supabase/migrations/001_schema.sql.
// Si más adelante corres `supabase gen types typescript --project-id ...`, puedes
// reemplazar este archivo por el generado — la forma (Database.public.Tables...) es la misma.
//
// IMPORTANTE: estos tipos de fila deben declararse con `type`, no `interface`. Con TypeScript
// 6 + supabase-js, una fila declarada como `interface` hace que el cliente tipado colapse a
// `never` en todos los `.insert()/.update()/.from()` (se comprobó a mano: el mismo shape como
// `interface` rompe la inferencia, como `type` funciona). Ya nos costó media hora, no lo repitas.

export type CorteEnum = 'Corte Recto' | 'Corte Oversize' | 'Corte Polo' | 'Corte Niño'
export type TallaEnum = 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'XXXL'
export type FotoTipoEnum = 'frente' | 'espalda'
export type ProspectoEstatusEnum = 'Nuevo' | 'Contactado' | 'Negociando' | 'Ganado' | 'Perdido'
export type ConsignacionEstadoEnum = 'en_exhibicion' | 'vendida' | 'devuelta'
export type PedidoEstatusEnum = 'Pendiente' | 'En proceso' | 'Listo' | 'Entregado'
export type MovimientoTipoEnum = 'gasto' | 'ingreso'
export type VarianteTipoEnum = 'talla' | 'color'

export type BzProducto = {
  id: string
  user_id: string
  nombre: string
  corte: CorteEnum
  categoria: string
  marca: string | null
  precio: number
  notas: string | null
  created_at: string
}

export type BzProductoFoto = {
  id: string
  producto_id: string
  tipo: FotoTipoEnum
  storage_path: string
  created_at: string
}

export type BzProductoTalla = {
  id: string
  producto_id: string
  talla: TallaEnum
  cantidad: number
}

export type BzCliente = {
  id: string
  user_id: string
  nombre: string
  contacto: string | null
  notas: string | null
  created_at: string
}

export type BzClienteStats = {
  cliente_id: string
  compras: number
  gasto_total: number
  ultima_compra: string
}

export type BzProspecto = {
  id: string
  user_id: string
  nombre: string
  contacto: string | null
  interes: string | null
  estatus: ProspectoEstatusEnum
  fecha: string
}

export type BzVenta = {
  id: string
  user_id: string
  cliente_id: string | null
  fecha: string
  notas: string | null
  origen: 'directa' | 'consignacion'
}

export type BzVentaItem = {
  id: string
  venta_id: string
  producto_id: string
  talla: TallaEnum
  cantidad: number
  precio_unitario: number
}

export type BzConsignacion = {
  id: string
  user_id: string
  socio: string
  ubicacion: string | null
  comision_pct: number
  fecha: string
  notas: string | null
}

export type BzConsignacionPieza = {
  id: string
  consignacion_id: string
  producto_id: string
  talla: TallaEnum
  cantidad: number
  estado: ConsignacionEstadoEnum
  fecha_estado: string
  precio_venta: number | null
  comision_monto: number | null
  ganancia_usuario: number | null
  venta_id: string | null
}

export type BzCostoInsumo = {
  id: string
  user_id: string
  clave: string
  valor: number
  unidad: string | null
  notas: string | null
}

export type BzCostoBlank = {
  id: string
  user_id: string
  corte: CorteEnum
  talla: TallaEnum
  precio: number
}

export type TpCliente = {
  id: string
  user_id: string
  nombre: string
  contacto: string | null
  notas: string | null
  created_at: string
}

export type TpProspecto = {
  id: string
  user_id: string
  nombre: string
  contacto: string | null
  interes: string | null
  estatus: ProspectoEstatusEnum
  fecha: string
}

export type TpPedido = {
  id: string
  user_id: string
  cliente_id: string | null
  diseno: string
  talla: TallaEnum | null
  precio: number
  estatus: PedidoEstatusEnum
  fecha: string
}

export type TpStock = {
  id: string
  user_id: string
  nombre: string
  variante_label: string
  tipo_variante: VarianteTipoEnum
  precio: number
  costo: number | null
  cantidad: number
}

export type FzMovimiento = {
  id: string
  user_id: string
  tipo: MovimientoTipoEnum
  categoria: string
  monto: number
  descripcion: string | null
  fecha: string
}

export type FzPresupuesto = {
  id: string
  user_id: string
  categoria: string
  mes: string
  limite: number
}

export type FzPresupuestoProgreso = {
  id: string
  user_id: string
  categoria: string
  mes: string
  limite: number
  gasto_real: number
}

export type FzMetaAhorro = {
  id: string
  user_id: string
  nombre: string
  monto_objetivo: number
}

// Stock de playeras en blanco, compartido entre Backzzxc y TurboPrints95 (ambos negocios
// estampan sobre el mismo blanco, así que es un solo inventario, no uno por negocio).
export type StockBlanco = {
  id: string
  user_id: string
  corte: CorteEnum
  color: string
  talla: TallaEnum
  cantidad: number
}

type Relationship = {
  foreignKeyName: string
  columns: string[]
  isOneToOne?: boolean
  referencedRelation: string
  referencedColumns: string[]
}

// Omite las columnas autogeneradas/con default (`Auto`) y además vuelve opcionales las
// columnas nullable (`Nullable`) en el tipo de Insert — igual que hace `supabase gen types`.
type TableDef<Row, Auto extends keyof Row, Nullable extends keyof Row = never, R extends Relationship[] = []> = {
  Row: Row
  Insert: Omit<Row, Auto | Nullable> & Partial<Pick<Row, Nullable>>
  Update: Partial<Omit<Row, Auto>>
  Relationships: R
}

export type Database = {
  public: {
    Tables: {
      bz_productos: TableDef<BzProducto, 'id' | 'user_id' | 'created_at', 'categoria' | 'notas' | 'marca'>
      bz_producto_fotos: TableDef<
        BzProductoFoto,
        'id' | 'created_at',
        never,
        [Relationship & { foreignKeyName: 'bz_producto_fotos_producto_id_fkey'; columns: ['producto_id']; referencedRelation: 'bz_productos'; referencedColumns: ['id'] }]
      >
      bz_producto_tallas: TableDef<
        BzProductoTalla,
        'id',
        never,
        [Relationship & { foreignKeyName: 'bz_producto_tallas_producto_id_fkey'; columns: ['producto_id']; referencedRelation: 'bz_productos'; referencedColumns: ['id'] }]
      >
      bz_clientes: TableDef<BzCliente, 'id' | 'user_id' | 'created_at', 'contacto' | 'notas'>
      bz_prospectos: TableDef<BzProspecto, 'id' | 'user_id', 'contacto' | 'interes'>
      bz_ventas: TableDef<
        BzVenta,
        'id' | 'user_id' | 'fecha',
        'cliente_id' | 'notas',
        [Relationship & { foreignKeyName: 'bz_ventas_cliente_id_fkey'; columns: ['cliente_id']; referencedRelation: 'bz_clientes'; referencedColumns: ['id'] }]
      >
      bz_venta_items: TableDef<
        BzVentaItem,
        'id',
        never,
        [
          Relationship & { foreignKeyName: 'bz_venta_items_venta_id_fkey'; columns: ['venta_id']; referencedRelation: 'bz_ventas'; referencedColumns: ['id'] },
          Relationship & { foreignKeyName: 'bz_venta_items_producto_id_fkey'; columns: ['producto_id']; referencedRelation: 'bz_productos'; referencedColumns: ['id'] },
        ]
      >
      bz_consignaciones: TableDef<BzConsignacion, 'id' | 'user_id', 'ubicacion' | 'notas'>
      bz_consignacion_piezas: TableDef<
        BzConsignacionPieza,
        'id',
        'fecha_estado' | 'estado' | 'precio_venta' | 'comision_monto' | 'ganancia_usuario' | 'venta_id',
        [
          Relationship & { foreignKeyName: 'bz_consignacion_piezas_consignacion_id_fkey'; columns: ['consignacion_id']; referencedRelation: 'bz_consignaciones'; referencedColumns: ['id'] },
          Relationship & { foreignKeyName: 'bz_consignacion_piezas_producto_id_fkey'; columns: ['producto_id']; referencedRelation: 'bz_productos'; referencedColumns: ['id'] },
        ]
      >
      bz_costos_insumos: TableDef<BzCostoInsumo, 'id' | 'user_id', 'unidad' | 'notas'>
      bz_costos_blank: TableDef<BzCostoBlank, 'id' | 'user_id'>
      stock_blancos: TableDef<StockBlanco, 'id' | 'user_id'>
      tp_clientes: TableDef<TpCliente, 'id' | 'user_id' | 'created_at', 'contacto' | 'notas'>
      tp_prospectos: TableDef<TpProspecto, 'id' | 'user_id', 'contacto' | 'interes'>
      tp_pedidos: TableDef<
        TpPedido,
        'id' | 'user_id',
        'cliente_id' | 'talla',
        [Relationship & { foreignKeyName: 'tp_pedidos_cliente_id_fkey'; columns: ['cliente_id']; referencedRelation: 'tp_clientes'; referencedColumns: ['id'] }]
      >
      tp_stock: TableDef<TpStock, 'id' | 'user_id', 'costo'>
      fz_movimientos: TableDef<FzMovimiento, 'id' | 'user_id', 'descripcion'>
      fz_presupuestos: TableDef<FzPresupuesto, 'id' | 'user_id'>
      fz_meta_ahorro: TableDef<FzMetaAhorro, 'id' | 'user_id'>
    }
    Views: {
      bz_clientes_stats: { Row: BzClienteStats; Relationships: [] }
      fz_presupuesto_progreso: { Row: FzPresupuestoProgreso; Relationships: [] }
    }
    Functions: {
      registrar_venta: {
        Args: {
          p_cliente_id: string | null
          p_items: { producto_id: string; talla: TallaEnum; cantidad: number; precio_unitario: number }[]
          p_notas?: string | null
          p_origen?: string
          p_fecha?: string | null
        }
        Returns: string
      }
      marcar_pieza_vendida: {
        Args: { p_pieza_id: string; p_precio_venta: number }
        Returns: string
      }
    }
  }
}
