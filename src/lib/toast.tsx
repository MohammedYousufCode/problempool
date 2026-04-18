import { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'
interface Toast { id: string; type: ToastType; message: string }

const ToastCtx = createContext<{ toast: (type: ToastType, message: string) => void }>({ toast: () => {} })

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((type: ToastType, message: string) => {
    const id = Math.random().toString(36).slice(2)
    setToasts(prev => [...prev, { id, type, message }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4500)
  }, [])

  const remove = (id: string) => setToasts(prev => prev.filter(t => t.id !== id))

  const icons = { success: <CheckCircle size={16} style={{ color: 'var(--color-success)', flexShrink: 0 }} />, error: <AlertCircle size={16} style={{ color: 'var(--color-error)', flexShrink: 0 }} />, info: <Info size={16} style={{ color: 'var(--color-primary)', flexShrink: 0 }} /> }

  return (
    <ToastCtx.Provider value={{ toast }}>
      {children}
      <div className="toast-container" role="region" aria-label="Notifications" aria-live="polite">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            {icons[t.type]}
            <span style={{ flex: 1, fontSize: 'var(--text-sm)' }}>{t.message}</span>
            <button onClick={() => remove(t.id)} aria-label="Dismiss" style={{ color: 'var(--color-text-faint)', display: 'flex', flexShrink: 0, padding: '0.1rem' }}>
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}

export const useToast = () => useContext(ToastCtx)