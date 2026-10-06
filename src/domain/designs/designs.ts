import type { GarlandShape } from '../garland/types'

export type DesignType = 'dog' | 'cat' | 'bones' | 'name' | 'day-of-dead' | 'generic'

export type Design = {
  id: string
  name: string
  type: DesignType
  supportedShapes: GarlandShape[]
}

export const designs: Design[] = [
  { id: 'huesos', name: 'Huesos', type: 'bones', supportedShapes: ['semi-circle'] },
  { id: 'perrito', name: 'Perrito', type: 'generic', supportedShapes: ['semi-circle'] },
  { id: 'nombre', name: 'Nombre', type: 'name', supportedShapes: ['semi-circle', 'rectangle'] },
  { id: 'schnauzer', name: 'Schnauzer', type: 'dog', supportedShapes: ['semi-circle', 'rectangle'] },
  { id: 'tekkel', name: 'Tekkel', type: 'dog', supportedShapes: ['semi-circle', 'rectangle'] },
  { id: 'chihuahua', name: 'Chihuahua', type: 'dog', supportedShapes: ['semi-circle', 'rectangle'] },
  { id: 'golden', name: 'Golden', type: 'dog', supportedShapes: ['semi-circle', 'rectangle'] },
  { id: 'border', name: 'Border', type: 'dog', supportedShapes: ['semi-circle', 'rectangle'] },
  { id: 'boxer', name: 'Boxer', type: 'dog', supportedShapes: ['semi-circle', 'rectangle'] },
  { id: 'bullterrier', name: 'Bull Terrier', type: 'dog', supportedShapes: ['semi-circle', 'rectangle'] },
  { id: 'pitbull', name: 'Pitbull', type: 'dog', supportedShapes: ['semi-circle', 'rectangle'] },
  { id: 'terrierescoces', name: 'Terrier escocés', type: 'dog', supportedShapes: ['semi-circle', 'rectangle'] },
  { id: 'frenchpoodle', name: 'French Poodle', type: 'dog', supportedShapes: ['semi-circle', 'rectangle'] },
  { id: 'pomeranian', name: 'Pomeranian', type: 'dog', supportedShapes: ['semi-circle', 'rectangle'] },
  { id: 'sabueso', name: 'Sabueso', type: 'dog', supportedShapes: ['semi-circle', 'rectangle'] },
  { id: 'pastoraleman', name: 'Pastor alemán', type: 'dog', supportedShapes: ['semi-circle', 'rectangle'] },
  { id: 'cocker', name: 'Cocker', type: 'dog', supportedShapes: ['semi-circle', 'rectangle'] },
  { id: 'pug', name: 'Pug', type: 'dog', supportedShapes: ['semi-circle', 'rectangle'] },
  { id: 'husky', name: 'Husky', type: 'dog', supportedShapes: ['semi-circle', 'rectangle'] },
  { id: 'gato', name: 'Gato', type: 'cat', supportedShapes: ['semi-circle', 'rectangle'] },
  { id: 'bulldogfrances', name: 'Bulldog francés', type: 'dog', supportedShapes: ['semi-circle', 'rectangle'] },
  { id: 'diademuertos', name: 'Día de Muertos', type: 'day-of-dead', supportedShapes: ['rectangle'] },
]

export const getDesign = (designId: string) => designs.find((design) => design.id === designId)