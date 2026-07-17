import { Route, Routes } from 'react-router-dom'
import { Landing } from './components/landing/Landing'
import { Login } from './components/landing/Login'
import { AuthGuard } from './components/shell/AuthGuard'
import { BackzzxcRoutes } from './features/backzzxc/BackzzxcRoutes'
import { TurboPrintsRoutes } from './features/turboprints/TurboPrintsRoutes'
import { FinanzasRoutes } from './features/finanzas/FinanzasRoutes'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/backzzxc/*"
        element={
          <AuthGuard>
            <BackzzxcRoutes />
          </AuthGuard>
        }
      />
      <Route
        path="/turboprints/*"
        element={
          <AuthGuard>
            <TurboPrintsRoutes />
          </AuthGuard>
        }
      />
      <Route
        path="/finanzas/*"
        element={
          <AuthGuard>
            <FinanzasRoutes />
          </AuthGuard>
        }
      />
    </Routes>
  )
}

export default App
