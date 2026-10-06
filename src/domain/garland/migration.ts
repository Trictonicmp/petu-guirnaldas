import { colors } from '../colors/colors'
import { MAX_BANDERINES, type GarlandItem, type GarlandShape, type GarlandSlot } from './types'
import { createEmptyGarlandSlots } from './rules'

type PersistedGarland = {
  items: GarlandSlot[]
  orderNumber?: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isGarlandShape(value: unknown): value is GarlandShape {
  return value === 'semi-circle' || value === 'rectangle'
}

const legacyColorValues: Record<string, string> = {
  rojo: '#D7473E',
  naranja: '#ED8B3A',
  verde: '#4D9C72',
  azul: '#568CB8',
  morado: '#8C6BA7',
  negro: '#353638',
  blanco: '#FFFDF7',
}

function normalizeColorId(colorId: string) {
  if (colors.some((color) => color.id === colorId)) return colorId
  const previousValue = legacyColorValues[colorId]
  if (!previousValue) return colors.find((color) => color.id === 'kraft-natural')!.id

  const channels = (hex: string) => hex.match(/[A-F\d]{2}/gi)!.map((channel) => Number.parseInt(channel, 16))
  const [red, green, blue] = channels(previousValue)
  return colors.reduce((closest, color) => {
    const [candidateRed, candidateGreen, candidateBlue] = channels(color.value)
    const distance = (red - candidateRed) ** 2 + (green - candidateGreen) ** 2 + (blue - candidateBlue) ** 2
    const [closestRed, closestGreen, closestBlue] = channels(closest.value)
    const closestDistance = (red - closestRed) ** 2 + (green - closestGreen) ** 2 + (blue - closestBlue) ** 2
    return distance < closestDistance ? color : closest
  }).id
}

function getLegacyItem(value: unknown, lineIndex: number): { item: Omit<GarlandItem, 'id'>; quantity: number; id: string } | undefined {
  if (!isRecord(value) || !isGarlandShape(value.shape)) return undefined
  if (typeof value.designId !== 'string' || typeof value.colorId !== 'string') return undefined
  if (!Number.isInteger(value.quantity) || (value.quantity as number) < 1) return undefined

  const customization = isRecord(value.customization) && typeof value.customization.name === 'string'
    ? { name: value.customization.name }
    : undefined
  const item = {
    shape: value.shape,
    designId: value.designId,
    colorId: normalizeColorId(value.colorId),
    ...(customization ? { customization } : {}),
  }
  return {
    item,
    quantity: Math.min(value.quantity as number, MAX_BANDERINES),
    id: typeof value.id === 'string' ? value.id : `legacy-${lineIndex}`,
  }
}

export function migrateGarlandState(state: unknown): PersistedGarland {
  const persisted = isRecord(state) ? state : {}
  const slots = createEmptyGarlandSlots()
  let nextSlot = 0

  if (Array.isArray(persisted.items)) {
    const isSlotArray = persisted.items.length === MAX_BANDERINES && persisted.items.every((item) =>
      item === null || (isRecord(item) && !('quantity' in item)),
    )

    if (isSlotArray) {
      persisted.items.forEach((savedItem, index) => {
        if (!isRecord(savedItem) || !isGarlandShape(savedItem.shape)) return
        if (typeof savedItem.designId !== 'string' || typeof savedItem.colorId !== 'string') return
        const customization = isRecord(savedItem.customization) && typeof savedItem.customization.name === 'string'
          ? { name: savedItem.customization.name }
          : undefined
        slots[index] = {
          id: typeof savedItem.id === 'string' ? savedItem.id : `slot-${index}`,
          shape: savedItem.shape,
          designId: savedItem.designId,
          colorId: normalizeColorId(savedItem.colorId),
          ...(customization ? { customization } : {}),
        }
      })
    } else {
    persisted.items.forEach((legacyLine, lineIndex) => {
      if (legacyLine === null || nextSlot === MAX_BANDERINES) return
      if (isRecord(legacyLine) && !('quantity' in legacyLine)) {
        if (!isGarlandShape(legacyLine.shape) || typeof legacyLine.designId !== 'string' || typeof legacyLine.colorId !== 'string') return
        const customization = isRecord(legacyLine.customization) && typeof legacyLine.customization.name === 'string'
          ? { name: legacyLine.customization.name }
          : undefined
        slots[nextSlot] = {
          id: typeof legacyLine.id === 'string' ? legacyLine.id : `slot-${lineIndex}`,
          shape: legacyLine.shape,
          designId: legacyLine.designId,
          colorId: normalizeColorId(legacyLine.colorId),
          ...(customization ? { customization } : {}),
        }
        nextSlot += 1
        return
      }
      const parsed = getLegacyItem(legacyLine, lineIndex)
      if (!parsed) return
      for (let copyIndex = 0; copyIndex < parsed.quantity && nextSlot < MAX_BANDERINES; copyIndex += 1) {
        slots[nextSlot] = { ...parsed.item, id: `${parsed.id}-${copyIndex + 1}` }
        nextSlot += 1
      }
    })
    }
  }

  return {
    items: slots,
    ...(typeof persisted.orderNumber === 'string' ? { orderNumber: persisted.orderNumber } : {}),
  }
}