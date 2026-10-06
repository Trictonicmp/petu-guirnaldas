const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env

export const whatsappConfig = {
  baseUrl: 'https://wa.me',
  // Se define con VITE_WHATSAPP_PHONE (ver .env.example). Formato internacional solo con dígitos, p. ej. "5215512345678". Vacío abre WhatsApp sin chat destino.
  phone: env?.VITE_WHATSAPP_PHONE ?? '',
}
