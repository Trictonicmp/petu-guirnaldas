import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getLineKey, getTotalQuantity, validateLine } from '../domain/garland/rules'
import { MAX_BANDERINES, type GarlandLine } from '../domain/garland/types'

const STORAGE_KEY = 'petu-garland-config'

type GarlandState = {
  items: GarlandLine[]
  orderNumber: string
  addItem: (line: Omit<GarlandLine, 'id'>) => string | undefined
  updateItem: (id: string, changes: Partial<Omit<GarlandLine, 'id'>>) => string | undefined
  removeItem: (id: string) => void
  increaseQuantity: (id: string) => void
  decreaseQuantity: (id: string) => void
  clearGarland: () => void
  setOrderNumber: (value: string) => void
}

export const useGarlandStore = create<GarlandState>()(persist((set, get) => ({
  items: [],
  orderNumber: '',
  addItem: (line) => {
    const error = validateLine(line)
    if (error) return error
    const items = get().items
    const key = getLineKey(line)
    const existing = items.find((item) => getLineKey(item) === key)
    const remaining = MAX_BANDERINES - getTotalQuantity(items)
    if (line.quantity > remaining) return `Solo puedes agregar ${remaining} banderines más.`
    if (existing) {
      set({ items: items.map((item) => item.id === existing.id ? { ...item, quantity: item.quantity + line.quantity } : item) })
    } else {
      set({ items: [...items, { ...line, id: crypto.randomUUID() }] })
    }
    return undefined
  },
  updateItem: (id, changes) => {
    const state = get()
    const current = state.items.find((item) => item.id === id)
    if (!current) return 'No se encontró esa línea.'
    const updated = { ...current, ...changes }
    const validationError = validateLine(updated)
    if (validationError) return validationError
    const others = state.items.filter((item) => item.id !== id)
    if (getTotalQuantity(others) + updated.quantity > MAX_BANDERINES) return `Solo puedes agregar ${MAX_BANDERINES - getTotalQuantity(others)} banderines a esta línea.`
    const duplicate = others.find((item) => getLineKey(item) === getLineKey(updated))
    set({ items: duplicate
      ? others.map((item) => item.id === duplicate.id ? { ...item, quantity: item.quantity + updated.quantity } : item)
      : state.items.map((item) => item.id === id ? updated : item) })
    return undefined
  },
  removeItem: (id) => set((state) => ({ items: state.items.filter((item) => item.id !== id) })),
  increaseQuantity: (id) => set((state) => {
    if (getTotalQuantity(state.items) >= MAX_BANDERINES) return state
    return { items: state.items.map((item) => item.id === id ? { ...item, quantity: item.quantity + 1 } : item) }
  }),
  decreaseQuantity: (id) => set((state) => ({
    items: state.items.flatMap((item) => item.id !== id ? [item] : item.quantity <= 1 ? [] : [{ ...item, quantity: item.quantity - 1 }]),
  })),
  clearGarland: () => {
    set({ items: [], orderNumber: '' })
    if (typeof localStorage !== 'undefined') localStorage.removeItem(STORAGE_KEY)
  },
  setOrderNumber: (orderNumber) => set({ orderNumber }),
}), {
  name: STORAGE_KEY,
  partialize: ({ items, orderNumber }) => ({ items, orderNumber }),
}))