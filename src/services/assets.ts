import type { GarlandShape } from '../domain/garland/types'
import type { DesignType } from '../domain/designs/designs'

export function getBanderinSvg(shape: GarlandShape, designId: string): string {
  const prefix = shape === 'semi-circle' ? 'semi-circulo' : 'tradicional'
  const artId = designId === 'otro' ? 'nombre' : designId
  return `/assets/${prefix}-${artId}.svg`
}

export function getDesignSilhouette(designId: string): string {
  return `/assets/silhouettes/silueta-${designId}.svg`
}

export function getDesignPreview(designId: string, type: DesignType): string | undefined {
  if (type === 'dog' || type === 'cat') return getDesignSilhouette(designId)
  if (type === 'bones' || type === 'generic' || type === 'day-of-dead') {
    return `/assets/variants/variante-${designId}.svg`
  }
  return undefined
}