export type GarlandShape = 'semi-circle' | 'rectangle'

export type GarlandLine = {
  id: string
  shape: GarlandShape
  designId: string
  colorId: string
  quantity: number
  customization?: { name?: string }
}

export type Garland = {
  items: GarlandLine[]
  orderNumber?: string
}

export const MAX_BANDERINES = 10