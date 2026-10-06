import { getDesign } from '../designs/designs'
import { MAX_BANDERINES, type GarlandItem, type GarlandSlot } from './types'

export const createEmptyGarlandSlots = (): GarlandSlot[] => Array(MAX_BANDERINES).fill(null)

export const getConfiguredCount = (slots: GarlandSlot[]) => slots.filter((slot) => slot !== null).length

export const areGarlandSlotsComplete = (slots: GarlandSlot[]) =>
  slots.length === MAX_BANDERINES && getConfiguredCount(slots) === MAX_BANDERINES

export const getGarlandItemKey = (item: Omit<GarlandItem, 'id'>) =>
  JSON.stringify([
    item.shape,
    item.designId,
    item.colorId,
    item.customization?.name?.trim().toLocaleUpperCase() ?? '',
  ])

export const validateGarlandItem = (item: Omit<GarlandItem, 'id'>) => {
  const design = getDesign(item.designId)
  if (!design || !design.supportedShapes.includes(item.shape)) return 'Ese diseño no está disponible para esta forma.'
  if (design.type === 'name' && !item.customization?.name?.trim()) return 'Ingresa un nombre.'
  if (design.type === 'name' && (item.customization?.name?.trim().length ?? 0) > 16) {
    return 'El nombre puede tener hasta 16 caracteres.'
  }
  return undefined
}

