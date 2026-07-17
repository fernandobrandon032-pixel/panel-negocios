import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'

const ToastContext = createContext<((message: string) => void) | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = useCallback((msg: string) => {
    setMessage(msg)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => setMessage(null), 2600)
  }, [])

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div className={`toast${message ? ' show' : ''}`}>{message}</div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast debe usarse dentro de <ToastProvider>')
  return ctx
}
