import { afterEach, describe, expect, test } from 'bun:test'
import { buildWhatsAppMessage, getWhatsAppUrl } from '../src/services/whatsapp'
import { getTotalQuantity, isComplete } from '../src/domain/garland/rules'

const schnauzer = { shape: 'semi-circle' as const, designId: 'schnauzer', colorId: 'rosa', quantity: 2 }
const storageData = new Map<string, string>()

Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: (key) => storageData.get(key) ?? null,
    setItem: (key, value) => storageData.set(key, value),
    removeItem: (key) => storageData.delete(key),
    clear: () => storageData.clear(),
    key: (index) => [...storageData.keys()][index] ?? null,
    get length() { return storageData.size },
} as Storage })
const { useGarlandStore } = await import('../src/store/garlandStore')

afterEach(() => useGarlandStore.getState().clearGarland())

describe('garland configuration', () => {
  test('merges identical lines and keeps color as part of identity', () => {
    const store = useGarlandStore.getState()
    expect(store.addItem(schnauzer)).toBeUndefined()
    expect(useGarlandStore.getState().addItem({ ...schnauzer, quantity: 1 })).toBeUndefined()
    expect(useGarlandStore.getState().addItem({ ...schnauzer, colorId: 'azul', quantity: 1 })).toBeUndefined()
    expect(useGarlandStore.getState().items).toHaveLength(2)
    expect(useGarlandStore.getState().items.map((item) => item.quantity)).toEqual([3, 1])
  })

  test('prevents exceeding 10 and reports completion at exactly 10', () => {
    const store = useGarlandStore.getState()
    expect(store.addItem({ ...schnauzer, quantity: 10 })).toBeUndefined()
    expect(useGarlandStore.getState().addItem(schnauzer)).toContain('Solo puedes agregar 0')
    expect(getTotalQuantity(useGarlandStore.getState().items)).toBe(10)
    expect(isComplete(useGarlandStore.getState().items)).toBe(true)
  })

  test('requires a name design customization', () => {
    expect(useGarlandStore.getState().addItem({ ...schnauzer, designId: 'nombre' })).toBe('Ingresa un nombre.')
  })

  test('removes persisted configuration when clearing', () => {
    useGarlandStore.getState().addItem(schnauzer)
    useGarlandStore.getState().clearGarland()
    expect(useGarlandStore.getState().items).toEqual([])
    expect(storageData.has('petu-garland-config')).toBe(false)
  })
})

describe('WhatsApp message', () => {
  test('includes order, customized line, quantity and encodes the link', () => {
    const message = buildWhatsAppMessage('A-42', [{
      id: 'line-1',
      shape: 'semi-circle',
      designId: 'nombre',
      colorId: 'rosa',
      quantity: 3,
      customization: { name: 'LUNA' },
    }])
    expect(message).toContain('Número de pedido: A-42')
    expect(message).toContain('Nombre "LUNA" · Rosa ×3')
    expect(message).toContain('Total: 3 banderines')
    expect(getWhatsAppUrl(message)).toContain(encodeURIComponent(message))
  })
})