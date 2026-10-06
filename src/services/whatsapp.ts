import { colors } from '../domain/colors/colors'
import { whatsappConfig } from '../config/whatsapp'
import { getDesign } from '../domain/designs/designs'
import { getGarlandItemKey } from '../domain/garland/rules'
import type { GarlandItem, GarlandSlot } from '../domain/garland/types'

export function buildWhatsAppMessage(orderNumber: string, items: GarlandSlot[], shareUrl?: string) {
  const grouped = new Map<string, { item: GarlandItem; quantity: number }>()
  for (const item of items) {
    if (!item) continue
    const key = getGarlandItemKey(item)
    const group = grouped.get(key)
    grouped.set(key, { item, quantity: (group?.quantity ?? 0) + 1 })
  }

  const lines = [...grouped.values()].map(({ item, quantity }, index) => {
    const design = getDesign(item.designId)?.name ?? item.designId
    const color = colors.find((candidate) => candidate.id === item.colorId)?.name ?? item.colorId
    const isOther = item.designId === 'otro'
    const name = item.customization?.name
      ? isOther ? ` (silueta solicitada: "${item.customization.name.trim()}")` : ` "${item.customization.name.trim()}"`
      : ''
    const shape = item.shape === 'semi-circle' ? 'Semicírculo' : 'Rectángulo'
    return `${index + 1}. ${design}${name} · ${shape} · ${color} ×${quantity}`
  })
  const total = [...grouped.values()].reduce((sum, group) => sum + group.quantity, 0)
  const link = shareUrl ? `\n\nVer configuración:\n${shareUrl}` : ''
  const hasRequests = [...grouped.values()].some(({ item }) => item.designId === 'otro')
  const requestNote = hasRequests ? '\n\nIncluye siluetas por solicitar: enviaré imágenes de referencia por este chat.' : ''
  return `🎀 PEDIDO DE GUIRNALDA\n\nNúmero de pedido: ${orderNumber.trim()}\n\nBanderines:\n\n${lines.join('\n')}\n\nTotal: ${total} banderines${requestNote}${link}`
}

export function getWhatsAppUrl(message: string, phone = whatsappConfig.phone) {
  return `${whatsappConfig.baseUrl}/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`
}