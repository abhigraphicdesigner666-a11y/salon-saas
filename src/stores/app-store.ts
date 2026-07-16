import { create } from 'zustand'
import type { Tenant, User, Notification } from '@/lib/types'

interface AppState {
  currentTenant: Tenant | null
  currentUser: User | null
  sidebarOpen: boolean
  notifications: Notification[]
  setTenant: (tenant: Tenant | null) => void
  setUser: (user: User | null) => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  addNotification: (notification: Notification) => void
  removeNotification: (id: string) => void
  markNotificationRead: (id: string) => void
}

export const useAppStore = create<AppState>((set) => ({
  currentTenant: null,
  currentUser: null,
  sidebarOpen: true,
  notifications: [],
  setTenant: (tenant) => set({ currentTenant: tenant }),
  setUser: (user) => set({ currentUser: user }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  addNotification: (notification) => set((state) => ({ notifications: [notification, ...state.notifications] })),
  removeNotification: (id) => set((state) => ({ notifications: state.notifications.filter((n) => n.id !== id) })),
  markNotificationRead: (id) => set((state) => ({
    notifications: state.notifications.map((n) => n.id === id ? { ...n, is_read: true } : n),
  })),
}))
