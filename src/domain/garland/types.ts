export type GarlandShape = 'semi-circle' | 'rectangle'

export type GarlandItem = {
  id: string
  shape: GarlandShape
  designId: string
  colorId: string
  customization?: { name?: string }
}

export type GarlandSlot = GarlandItem | null

export type Garland = {
  items: GarlandSlot[]
  orderNumber?: string
}

export const MAX_BANDERINES = 10