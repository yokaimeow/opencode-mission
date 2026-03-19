'use client';

import { create } from 'zustand';

interface UIState {
  isSidebarOpen: boolean;
  activeModal: string | null;
  notifications: Array<{ id: string; message: string; type: 'info' | 'success' | 'error' }>;
}

interface UIActions {
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  openModal: (modalId: string) => void;
  closeModal: () => void;
  addNotification: (notification: Omit<UIState['notifications'][0], 'id'>) => void;
  removeNotification: (id: string) => void;
}

type UIStore = UIState & UIActions;

export const useUIStore = create<UIStore>((set) => ({
  isSidebarOpen: true,
  activeModal: null,
  notifications: [],

  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (open: boolean) => set({ isSidebarOpen: open }),
  openModal: (modalId: string) => set({ activeModal: modalId }),
  closeModal: () => set({ activeModal: null }),
  addNotification: (notification) => set((state) => ({
    notifications: [...state.notifications, { ...notification, id: Date.now().toString() }],
  })),
  removeNotification: (id: string) => set((state) => ({
    notifications: state.notifications.filter((n) => n.id !== id),
  })),
}));
