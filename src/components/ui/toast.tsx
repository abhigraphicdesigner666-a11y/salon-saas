'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, CheckCircle, Info, X, XCircle } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info' | 'warning'

interface Toast {
  id: string
  message: string
  description?: string
  type: ToastType
}

interface ToastContextType {
  toast: (message: string, options?: { description?: string; type?: ToastType }) => void
  success: (message: string, description?: string) => void
  error: (message: string, description?: string) => void
  info: (message: string, description?: string) => void
  warning: (message: string, description?: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = (message: string, type: ToastType = 'info', description?: string) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { id, message, description, type }])
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  const toastHelpers = {
    toast: (message: string, options?: { description?: string; type?: ToastType }) => 
      addToast(message, options?.type || 'info', options?.description),
    success: (message: string, description?: string) => addToast(message, 'success', description),
    error: (message: string, description?: string) => addToast(message, 'error', description),
    info: (message: string, description?: string) => addToast(message, 'info', description),
    warning: (message: string, description?: string) => addToast(message, 'warning', description),
  }

  return (
    <ToastContext.Provider value={toastHelpers}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm">
        <AnimatePresence>
          {toasts.map((t) => (
            <ToastItem key={t.id} toast={t} onClose={() => removeToast(t.id)} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000)
    return () => clearTimeout(timer)
  }, [onClose])

  const icons = {
    success: <CheckCircle className="h-5 w-5 text-emerald-500" />,
    error: <XCircle className="h-5 w-5 text-rose-500" />,
    info: <Info className="h-5 w-5 text-blue-500" />,
    warning: <AlertCircle className="h-5 w-5 text-amber-500" />,
  }

  const borders = {
    success: 'border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/20',
    error: 'border-rose-500/20 bg-rose-50/50 dark:bg-rose-950/20',
    info: 'border-blue-500/20 bg-blue-50/50 dark:bg-blue-950/20',
    warning: 'border-amber-500/20 bg-amber-50/50 dark:bg-amber-950/20',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
      className={`flex items-start gap-3 p-4 rounded-xl border glass shadow-lg premium-shadow ${borders[toast.type]}`}
    >
      <div className="shrink-0 mt-0.5">{icons[toast.type]}</div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-foreground leading-snug">{toast.message}</h4>
        {toast.description && (
          <p className="text-xs text-muted-foreground mt-1 leading-normal">{toast.description}</p>
        )}
      </div>
      <button onClick={onClose} className="shrink-0 p-0.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors">
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
