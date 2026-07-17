import { Route, Routes } from 'react-router-dom'
import { BusinessShell } from '../../components/shell/BusinessShell'
import { ResumenTab } from './ResumenTab'
import { MovimientosTab } from './MovimientosTab'
import { PresupuestosTab } from './PresupuestosTab'
import { AhorroTab } from './AhorroTab'

const tabs = [
  { to: '/finanzas', label: 'Resumen', end: true },
  { to: '/finanzas/movimientos', label: 'Movimientos' },
  { to: '/finanzas/presupuestos', label: 'Presupuestos' },
  { to: '/finanzas/ahorro', label: 'Ahorro' },
]

export function FinanzasRoutes() {
  return (
    <Routes>
      <Route element={<BusinessShell theme="fz" brandName="Finanzas" tabs={tabs} />}>
        <Route index element={<ResumenTab />} />
        <Route path="movimientos" element={<MovimientosTab />} />
        <Route path="presupuestos" element={<PresupuestosTab />} />
        <Route path="ahorro" element={<AhorroTab />} />
      </Route>
    </Routes>
  )
}
