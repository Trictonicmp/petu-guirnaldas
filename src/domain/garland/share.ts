import { colors } from '../colors/colors'
import { createEmptyGarlandSlots, validateGarlandItem } from './rules'
import { MAX_BANDERINES, type GarlandItem, type GarlandShape, type GarlandSlot } from './types'

const SHAPE_CODES: Record<GarlandShape, string> = { 'semi-circle': 's', rectangle: 'r' }
const SHAPES_BY_CODE: Record<string, GarlandShape> = { s: 'semi-circle', r: 'rectangle' }

// Formato: 10 posiciones separadas por ","; vacía = "_"; ocupada = "forma:diseño:color[:nombre]".
export function serializeGarland(slots: GarlandSlot[]): string | undefined {
  if (!slots.some(Boolean)) return undefined
  return Array.from({ length: MAX_BANDERINES }, (_, index) => {
    const item = slots[index]
    if (!item) return '_'
    const parts = [SHAPE_CODES[item.shape], item.designId, item.colorId]
    const name = item.customization?.name?.trim()
    if (name) parts.push(encodeURIComponent(name))
    return parts.join(':')
  }).join(',')
}

export function parseGarland(value: unknown): GarlandSlot[] | undefined {
  if (typeof value !== 'string') return undefined
  const entries = value.split(',')
  if (entries.length !== MAX_BANDERINES) return undefined

  const slots = createEmptyGarlandSlots()
  entries.forEach((entry, index) => {
    const [shapeCode, designId, colorId, encodedName] = entry.split(':')
    const shape = SHAPES_BY_CODE[shapeCode]
    if (!shape || !designId || !colorId || !colors.some((color) => color.id === colorId)) return

    let name: string | undefined
    try {
      name = encodedName ? decodeURIComponent(encodedName) : undefined
    } catch {
      return
    }

    const item: Omit<GarlandItem, 'id'> = { shape, designId, colorId, ...(name ? { customization: { name } } : {}) }
    if (validateGarlandItem(item)) return
    slots[index] = { ...item, id: crypto.randomUUID() }
  })

  return slots.some(Boolean) ? slots : undefined
}

export function buildGarlandShareUrl(origin: string, slots: GarlandSlot[]): string {
  const garland = serializeGarland(slots)
  return garland ? `${origin}/?g=${encodeURIComponent(garland)}` : `${origin}/`
}
