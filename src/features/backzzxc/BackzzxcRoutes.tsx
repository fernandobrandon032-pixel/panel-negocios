import { Route, Routes } from 'react-router-dom'
import { BusinessShell } from '../../components/shell/BusinessShell'
import { ResumenTab } from './ResumenTab'
import { StockTab } from './StockTab/StockTab'
import { ClientesTab } from './ClientesTab'
import { ProspectosTab } from './ProspectosTab'
import { VentasTab } from './VentasTab/VentasTab'
import { ConsignacionTab } from './ConsignacionTab/ConsignacionTab'
import { CostosTab } from './CostosTab'

const tabs = [
  { to: '/backzzxc', label: 'Resumen', end: true },
  { to: '/backzzxc/stock', label: 'Stock' },
  { to: '/backzzxc/clientes', label: 'Clientes' },
  { to: '/backzzxc/prospectos', label: 'Prospectos' },
  { to: '/backzzxc/ventas', label: 'Ventas' },
  { to: '/backzzxc/consignacion', label: 'Consignación' },
  { to: '/backzzxc/costos', label: 'Costos' },
]

export function BackzzxcRoutes() {
  return (
    <Routes>
      <Route element={<BusinessShell theme="bz" brandName="Backzzxc" tabs={tabs} />}>
        <Route index element={<ResumenTab />} />
        <Route path="stock" element={<StockTab />} />
        <Route path="clientes" element={<ClientesTab />} />
        <Route path="prospectos" element={<ProspectosTab />} />
        <Route path="ventas" element={<VentasTab />} />
        <Route path="consignacion" element={<ConsignacionTab />} />
        <Route path="costos" element={<CostosTab />} />
      </Route>
    </Routes>
  )
}
