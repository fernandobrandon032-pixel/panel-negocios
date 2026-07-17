import { Route, Routes } from 'react-router-dom'
import { BusinessShell } from '../../components/shell/BusinessShell'
import { ResumenTab } from './ResumenTab'
import { PedidosTab } from './PedidosTab'
import { StockTab } from './StockTab'
import { ClientesTab } from './ClientesTab'
import { ProspectosTab } from './ProspectosTab'

const tabs = [
  { to: '/turboprints', label: 'Resumen', end: true },
  { to: '/turboprints/pedidos', label: 'Pedidos' },
  { to: '/turboprints/stock', label: 'Stock' },
  { to: '/turboprints/clientes', label: 'Clientes' },
  { to: '/turboprints/prospectos', label: 'Prospectos' },
]

export function TurboPrintsRoutes() {
  return (
    <Routes>
      <Route element={<BusinessShell theme="tp" brandName="TurboPrints95" tabs={tabs} />}>
        <Route index element={<ResumenTab />} />
        <Route path="pedidos" element={<PedidosTab />} />
        <Route path="stock" element={<StockTab />} />
        <Route path="clientes" element={<ClientesTab />} />
        <Route path="prospectos" element={<ProspectosTab />} />
      </Route>
    </Routes>
  )
}
