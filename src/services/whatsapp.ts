import { colors } from '../domain/colors/colors'
import { getDesign } from '../domain/designs/designs'
import type { GarlandLine } from '../domain/garland/types'

export function buildWhatsAppMessage(orderNumber: string, items: GarlandLine[]) {
  const lines = items.map((item, index) => {
    const design = getDesign(item.designId)?.name ?? item.designId
    const color = colors.find((candidate) => candidate.id === item.colorId)?.name ?? item.colorId
    const name = item.customization?.name ? ` "${item.customization.name.trim()}"` : ''
    return `${index + 1}. ${design}${name} · ${color} ×${item.quantity}`
  })
  const total = items.reduce((sum, item) => sum + item.quantity, 0)
  return `🎀 PEDIDO DE GUIRNALDA\n\nNúmero de pedido: ${orderNumber.trim()}\n\nBanderines:\n\n${lines.join('\n')}\n\nTotal: ${total} banderines`
}

export function getWhatsAppUrl(message: string) {
  return `https://wa.me/?text=${encodeURIComponent(message)}`
}