import type { GarlandShape } from '../domain/garland/types'

export function getBanderinSvg(shape: GarlandShape, designId: string): string {
  const prefix = shape === 'semi-circle' ? 'semi-circulo' : 'tradicional'
  return `/assets/${prefix}-${designId}.svg`
}