import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export interface ShellTab {
  to: string
  label: string
  end?: boolean
}

interface BusinessShellProps {
  theme: 'bz' | 'tp' | 'fz'
  brandName: string
  tabs: ShellTab[]
}

export function BusinessShell({ theme, brandName, tabs }: BusinessShellProps) {
  const navigate = useNavigate()
  const { signOut } = useAuth()

  return (
    <div className={`dash ${theme}`}>
      <header className="topbar">
        <NavLink to="/" className="brand">
          <span className="dot" />
          <span className="bname">{brandName}</span>
        </NavLink>
        <div className="topbar-actions">
          <button className="btn ghost small" onClick={() => navigate('/')}>
            Inicio
          </button>
          <button
            className="btn ghost small"
            onClick={async () => {
              await signOut()
              navigate('/login')
            }}
          >
            Cerrar sesión
          </button>
        </div>
      </header>
      <nav className="tabs">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) => `tab-btn${isActive ? ' active' : ''}`}
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>
      <main className="tabpanel">
        <Outlet />
      </main>
    </div>
  )
}
