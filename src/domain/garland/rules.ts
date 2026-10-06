import { getDesign } from '../designs/designs'
import { MAX_BANDERINES, type GarlandLine } from './types'

export const getTotalQuantity = (items: GarlandLine[]) =>
  items.reduce((total, item) => total + item.quantity, 0)

export const isComplete = (items: GarlandLine[]) => getTotalQuantity(items) === MAX_BANDERINES

export const getLineKey = (line: Omit<GarlandLine, 'id' | 'quantity'>) =>
  JSON.stringify([
    line.shape,
    line.designId,
    line.colorId,
    line.customization?.name?.trim().toLocaleUpperCase() ?? '',
  ])

export const validateLine = (line: Omit<GarlandLine, 'id'>) => {
  if (!Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > MAX_BANDERINES) {
    return 'Elige una cantidad entre 1 y 10.'
  }
  const design = getDesign(line.designId)
  if (!design || !design.supportedShapes.includes(line.shape)) return 'Ese diseño no está disponible para esta forma.'
  if (design.type === 'name' && !line.customization?.name?.trim()) return 'Ingresa un nombre.'
  if (design.type === 'name' && (line.customization?.name?.trim().length ?? 0) > 16) {
    return 'El nombre puede tener hasta 16 caracteres.'
  }
  return undefined
}