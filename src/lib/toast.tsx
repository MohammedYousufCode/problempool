import React, { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'
interface Toast { id: string; type: ToastType; message: string }

/** Safely coerce anything to a display string — prevents React error #31 */
function toMessage(raw: unknown): string {
  if (typeof raw === 'string') return raw || 'Something went wrong'
  if (raw instanceof Error) return raw.message || 'Something went wrong'
  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>
    if (typeof obj.message === 'string') return obj.message
    if (typeof obj.error === 'string') return obj.error
    if (typeof obj.msg === 'string') return obj.msg
    try { return JSON.stringify(raw) } catch { /* noop */ }
  }
  return 'Something went wrong'
}

const ToastCtx = createContext<{ toast: (type: ToastType, message: unknown) => void }>({ toast: () => {} })

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((type: ToastType, message: unknown) => {
    const msg = toMessage(message)
    const id = Math.random().toString(36).slice(2)
    setToasts((prev: Toast[]) => [...prev, { id, type, message: msg }])
    setTimeout(() => setToasts((prev: Toast[]) => prev.filter((t: Toast) => t.id !== id)), 4500)
  }, [])

  const remove = (id: string) => setToasts((prev: Toast[]) => prev.filter((t: Toast) => t.id !== id))

  const icons: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle size={16} style={{ color: 'var(--color-success)', flexShrink: 0 }} />,
    error: <AlertCircle size={16} style={{ color: 'var(--color-error)', flexShrink: 0 }} />,
    info: <Info size={16} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
  }

  return (
    <ToastCtx.Provider value={{ toast }}>
      {children}
      <div className="toast-container" role="region" aria-label="Notifications" aria-live="polite">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            {icons[t.type] ?? null}
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