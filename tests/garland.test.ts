import { afterEach, describe, expect, test } from 'bun:test'
import { colors } from '../src/domain/colors/colors'
import { buildSilhouetteRequestMessage, buildWhatsAppMessage, getWhatsAppUrl } from '../src/services/whatsapp'
import { getDesignSilhouette } from '../src/services/assets'
import { migrateGarlandState } from '../src/domain/garland/migration'
import { areGarlandSlotsComplete, getConfiguredCount } from '../src/domain/garland/rules'
import { buildGarlandShareUrl, parseGarland, serializeGarland } from '../src/domain/garland/share'

const schnauzer = { shape: 'semi-circle' as const, designId: 'schnauzer', colorId: 'rosa' }
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

afterEach(() => useGarlandStore.getState().resetGarland())

describe('garland configuration', () => {
  test('offers the current six paper colors', () => {
    expect(colors.map(({ value }) => value)).toEqual([
      '#FCAF2A',
      '#BBA7CB',
      '#A07DA3',
      '#FEBCA5',
      '#F7B3C3',
      '#C49679',
    ])
  })

  test('normalizes persisted colors removed from the catalog', () => {
    const migrated = migrateGarlandState({
      items: [
        { id: 'old-yellow', shape: 'semi-circle', designId: 'pug', colorId: 'amarillo' },
        { id: 'old-blue', shape: 'rectangle', designId: 'schnauzer', colorId: 'azul' },
      ],
    })
    expect(migrated.items[0]?.colorId).toBe('amarillo')
    expect(migrated.items[1]?.colorId).toBe('malva')
  })

  test('preserves empty positions when migrating an existing slot array', () => {
    const previousSlots = Array(10).fill(null)
    previousSlots[3] = { id: 'saved-item', shape: 'rectangle', designId: 'gato', colorId: 'azul' }
    const migrated = migrateGarlandState({ items: previousSlots })
    expect(migrated.items[0]).toBeNull()
    expect(migrated.items[3]).toMatchObject({ id: 'saved-item', colorId: 'malva' })
    expect(getConfiguredCount(migrated.items)).toBe(1)
  })

  test('expands legacy quantities into 10 slots and preserves the order number', () => {
    const migrated = migrateGarlandState({
      orderNumber: 'A-42',
      items: [
        { id: 'line-a', shape: 'semi-circle', designId: 'schnauzer', colorId: 'rosa', quantity: 3 },
        { id: 'line-b', shape: 'rectangle', designId: 'nombre', colorId: 'azul', quantity: 2, customization: { name: 'LUNA' } },
      ],
    })
    expect(migrated.items).toHaveLength(10)
    expect(getConfiguredCount(migrated.items)).toBe(5)
    expect(migrated.items.slice(5)).toEqual(Array(5).fill(null))
    expect(migrated.items[3]).toMatchObject({ id: 'line-b-1', customization: { name: 'LUNA' } })
    expect(migrated.orderNumber).toBe('A-42')
    expect(areGarlandSlotsComplete(migrated.items)).toBe(false)
  })

  test('caps malformed legacy data at ten positions', () => {
    const migrated = migrateGarlandState({
      items: [{ id: 'too-many', shape: 'semi-circle', designId: 'pug', colorId: 'rojo', quantity: 12 }],
    })
    expect(getConfiguredCount(migrated.items)).toBe(10)
    expect(areGarlandSlotsComplete(migrated.items)).toBe(true)
  })

  test('stores identical items as independent positions and keeps color per position', () => {
    const store = useGarlandStore.getState()
    expect(store.addItem(0, schnauzer)).toBeUndefined()
    expect(useGarlandStore.getState().addItem(1, schnauzer)).toBeUndefined()
    expect(useGarlandStore.getState().addItem(2, { ...schnauzer, colorId: 'azul' })).toBeUndefined()
    expect(useGarlandStore.getState().items).toHaveLength(10)
    expect(useGarlandStore.getState().items.slice(0, 3).map((item) => item?.colorId)).toEqual(['rosa', 'rosa', 'azul'])
  })

  test('keeps exactly ten positions and reports completion when all are configured', () => {
    const store = useGarlandStore.getState()
    for (let index = 0; index < 10; index += 1) expect(store.addItem(index, schnauzer)).toBeUndefined()
    expect(getConfiguredCount(useGarlandStore.getState().items)).toBe(10)
    expect(areGarlandSlotsComplete(useGarlandStore.getState().items)).toBe(true)
    expect(useGarlandStore.getState().addItem(10, schnauzer)).toContain('posición válida')
  })

  test('requires a name design customization', () => {
    expect(useGarlandStore.getState().addItem(0, { ...schnauzer, designId: 'nombre' })).toBe('Ingresa un nombre.')
  })

  test('removes a slot without shifting later positions and resets all ten slots', () => {
    const store = useGarlandStore.getState()
    store.addItem(0, schnauzer)
    store.addItem(1, { ...schnauzer, colorId: 'azul' })
    store.removeItem(0)
    expect(useGarlandStore.getState().items[0]).toBeNull()
    expect(useGarlandStore.getState().items[1]?.colorId).toBe('azul')
    store.resetGarland()
    expect(useGarlandStore.getState().items).toEqual(Array(10).fill(null))
    expect(storageData.has('petu-garland-config')).toBe(false)
  })

  test('duplicates an item into the first empty slot with an independent id', () => {
    const store = useGarlandStore.getState()
    store.addItem(2, { ...schnauzer, customization: { name: 'MILO' } })
    const source = useGarlandStore.getState().items[2]
    const targetIndex = useGarlandStore.getState().duplicateItem(2)
    const duplicate = targetIndex === undefined ? undefined : useGarlandStore.getState().items[targetIndex]
    expect(targetIndex).toBe(0)
    expect(duplicate).toMatchObject({ ...source, id: expect.any(String) })
    expect(duplicate?.id).not.toBe(source?.id)
  })

  test('does not duplicate into a full garland', () => {
    const store = useGarlandStore.getState()
    for (let index = 0; index < 10; index += 1) store.addItem(index, schnauzer)
    expect(useGarlandStore.getState().duplicateItem(0)).toBeUndefined()
    expect(getConfiguredCount(useGarlandStore.getState().items)).toBe(10)
  })
})

describe('shared garland link', () => {
  const slots = Array(10).fill(null)
  slots[0] = { id: 'a', shape: 'semi-circle', designId: 'schnauzer', colorId: 'rosa' }
  slots[3] = { id: 'b', shape: 'rectangle', designId: 'nombre', colorId: 'kraft-natural', customization: { name: 'Luna, María: 1' } }

  test('round-trips positions, empty slots and special characters in names', () => {
    const parsed = parseGarland(serializeGarland(slots))
    expect(parsed?.map((slot) => slot && { ...slot, id: undefined })).toEqual(
      slots.map((slot) => slot && { ...slot, id: undefined }),
    )
  })

  test('omits the parameter for an empty garland and rejects malformed values', () => {
    expect(serializeGarland(Array(10).fill(null))).toBeUndefined()
    expect(buildGarlandShareUrl('https://petu.test', Array(10).fill(null))).toBe('https://petu.test/')
    expect(parseGarland('s:schnauzer:rosa')).toBeUndefined()
    expect(parseGarland(undefined)).toBeUndefined()
  })

  test('drops invalid positions instead of loading unknown designs, colors or shapes', () => {
    const parsed = parseGarland('s:unicornio:rosa,s:pug:azul,r:huesos:rosa,x:pug:rosa,s:pug:rosa,_,_,_,_,_')
    expect(parsed?.map(Boolean)).toEqual([false, false, false, false, true, false, false, false, false, false])
  })

  test('adds the review link to the WhatsApp message', () => {
    const link = buildGarlandShareUrl('https://petu.test', slots)
    const message = buildWhatsAppMessage('A-42', slots, link)
    expect(message).toContain(`Ver configuración:\n${link}`)
    expect(link.startsWith('https://petu.test/?g=')).toBe(true)
  })
})

describe('WhatsApp message', () => {
  test('targets the configured phone and falls back to an open chat picker', () => {
    expect(getWhatsAppUrl('Hola', '+52 1 55 1234 5678')).toBe('https://wa.me/5215512345678?text=Hola')
    expect(getWhatsAppUrl('Hola', '')).toBe('https://wa.me/?text=Hola')
  })

  test('builds a request for a missing dog silhouette and resolves silhouette assets by convention', () => {
    expect(getDesignSilhouette('schnauzer')).toBe('/assets/silhouettes/silueta-schnauzer.svg')
    const message = buildSilhouetteRequestMessage('  Dálmata  ')
    expect(message).toContain('"Dálmata"')
    expect(message).toContain('imagen de referencia')
    expect(getWhatsAppUrl(message)).toContain(encodeURIComponent(message))
  })

  test('groups repeated slots and encodes the order message', () => {
    const repeatedItem = {
      id: 'line-1',
      shape: 'semi-circle',
      designId: 'nombre',
      colorId: 'rosa',
      customization: { name: 'LUNA' },
    }
    const message = buildWhatsAppMessage('A-42', [repeatedItem, { ...repeatedItem, id: 'line-2' }, { ...repeatedItem, id: 'line-3' }])
    expect(message).toContain('Número de pedido: A-42')
    expect(message).toContain('Nombre "LUNA" · Semicírculo · Rosa ×3')
    expect(message).toContain('Total: 3 banderines')
    expect(getWhatsAppUrl(message)).toContain(encodeURIComponent(message))
  })
})