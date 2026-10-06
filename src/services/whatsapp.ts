import { whatsappConfig } from '../config/whatsapp'
import type { GarlandSlot } from '../domain/garland/types'

export function buildWhatsAppMessage(orderNumber: string, items: GarlandSlot[], shareUrl?: string) {
  const order = orderNumber.trim().replace(/^#/, '')
  const header = `Pedido: #${order}\nHola, compré esta guirnalda${shareUrl ? `\n${shareUrl}` : ''}`
  const requests = items.flatMap((item, index) =>
    item?.designId === 'otro' && item.customization?.name?.trim()
      ? [`para el banderín #${index + 1} quiero silueta: ${item.customization.name.trim()}`]
      : [],
  )
  return requests.length ? `${header}\n\n${requests.join('\n')}` : header
}

export function getWhatsAppUrl(message: string, phone = whatsappConfig.phone) {
  return `${whatsappConfig.baseUrl}/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`
}