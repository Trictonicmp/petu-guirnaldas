import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createEmptyGarlandSlots, validateGarlandItem } from '../domain/garland/rules'
import { MAX_BANDERINES, type GarlandItem, type GarlandSlot } from '../domain/garland/types'
import { migrateGarlandState } from '../domain/garland/migration'

const STORAGE_KEY = 'petu-garland-config'

type GarlandState = {
  items: GarlandSlot[]
  orderNumber: string
  addItem: (index: number, item: Omit<GarlandItem, 'id'>) => string | undefined
  updateItem: (index: number, item: Omit<GarlandItem, 'id'>) => string | undefined
  duplicateItem: (index: number) => number | undefined
  removeItem: (index: number) => void
  loadGarland: (items: GarlandSlot[]) => void
  resetGarland: () => void
  setOrderNumber: (value: string) => void
}

export const useGarlandStore = create<GarlandState>()(persist((set, get) => ({
  items: createEmptyGarlandSlots(),
  orderNumber: '',
  addItem: (index, item) => {
    if (!Number.isInteger(index) || index < 0 || index >= MAX_BANDERINES) return 'Selecciona una posición válida.'
    if (get().items[index] !== null) return 'Esa posición ya tiene un banderín.'
    const error = validateGarlandItem(item)
    if (error) return error
    set((state) => ({ items: state.items.map((slot, slotIndex) => slotIndex === index ? { ...item, id: crypto.randomUUID() } : slot) }))
    return undefined
  },
  updateItem: (index, item) => {
    const current = get().items[index]
    if (!current) return 'No se encontró ese banderín.'
    const validationError = validateGarlandItem(item)
    if (validationError) return validationError
    const updated: GarlandItem = { ...item, id: current.id }
    set((state) => ({ items: state.items.map((slot, slotIndex) => slotIndex === index ? updated : slot) }))
    return undefined
  },
  duplicateItem: (index) => {
    const state = get()
    const source = state.items[index]
    const targetIndex = state.items.findIndex((slot) => slot === null)
    if (!source || targetIndex < 0) return undefined
    const duplicate: GarlandItem = {
      ...source,
      id: crypto.randomUUID(),
      ...(source.customization ? { customization: { ...source.customization } } : {}),
    }
    set((current) => ({
      items: current.items.map((slot, slotIndex) => slotIndex === targetIndex ? duplicate : slot),
    }))
    return targetIndex
  },
  removeItem: (index) => set((state) => ({ items: state.items.map((item, slotIndex) => slotIndex === index ? null : item) })),
  loadGarland: (items) => set({ items }),
  resetGarland: () => {
    set({ items: createEmptyGarlandSlots(), orderNumber: '' })
    if (typeof localStorage !== 'undefined') localStorage.removeItem(STORAGE_KEY)
  },
  setOrderNumber: (orderNumber) => set({ orderNumber }),
}), {
  name: STORAGE_KEY,
  version: 2,
  migrate: (persistedState) => migrateGarlandState(persistedState),
  partialize: ({ items, orderNumber }) => ({ items, orderNumber }),
}))