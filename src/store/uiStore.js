import { create } from 'zustand';

const useUiStore = create((set) => ({
  panelOpen: false,
  panelMode: 'view',
  toasts: [],
  searchQuery: '',
  filters: {},

  openPanel: (mode = 'view') => set({ panelOpen: true, panelMode: mode }),
  closePanel: () => set({ panelOpen: false, panelMode: 'view' }),
  setPanelMode: (mode) => set({ panelMode: mode }),

  addToast: (toast) =>
    set((state) => ({
      toasts: [...state.toasts, { id: Date.now() + Math.random(), ...toast }],
    })),
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  setSearchQuery: (query) => set({ searchQuery: query }),
  setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),
  clearFilters: () => set({ filters: {} }),
}));

export default useUiStore;
