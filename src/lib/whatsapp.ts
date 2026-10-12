import { formatPKR } from './format'

export const DEFAULT_ORDER_TEMPLATE = `Hello Looma Comfort, I'd like to order:

*{{product}}*
{{options}}
Quantity: {{quantity}}
Price: {{price}}
Total: {{total}}
SKU: {{sku}}

{{url}}

Please confirm availability and delivery to my city.`

export const DEFAULT_GENERAL_MESSAGE = `Hello Looma Comfort, I have a question.`

export const DEFAULT_CUSTOM_MESSAGE = `Hello Looma Comfort, I'd like to discuss a custom furniture order.`

/** "+92 300 1234567" → "923001234567" (wa.me format). Returns null if it can't be a valid number. */
export function normalizeWhatsAppNumber(input: string | null | undefined): string | null {
  if (!input) return null
  let digits = input.replace(/[^\d]/g, '')
  if (digits.startsWith('00')) digits = digits.slice(2)
  if (digits.startsWith('03') && digits.length === 11) digits = `92${digits.slice(1)}`
  if (digits.length < 10 || digits.length > 15) return null
  return digits
}

/**
 * Replaces {{placeholders}}. A line whose placeholders are all empty is removed,
 * so optional fields (SKU, total, options) disappear cleanly from the message.
 */
export function fillTemplate(template: string, vars: Record<string, string | number | null | undefined>): string {
  const lines = template.replace(/\r\n/g, '\n').split('\n')
  const out: string[] = []
  for (const line of lines) {
    const keys = [...line.matchAll(/\{\{\s*(\w+)\s*\}\}/g)].map((m) => m[1])
    if (keys.length && keys.every((k) => vars[k] == null || String(vars[k]).trim() === '')) continue
    out.push(line.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k: string) => (vars[k] == null ? '' : String(vars[k]))))
  }
  return out
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function whatsappLink(number: string | null | undefined, text: string): string | null {
  const n = normalizeWhatsAppNumber(number)
  if (!n) return null
  return `https://wa.me/${n}?text=${encodeURIComponent(text)}`
}

export interface OrderMessageInput {
  template?: string | null
  productName: string
  sku?: string | null
  options: { name: string; value: string }[]
  quantity: number
  unitPrice: number | null
  regularUnitPrice?: number | null
  url: string
}

export function buildOrderMessage(input: OrderMessageInput): string {
  const qty = Math.max(1, Math.floor(input.quantity || 1))
  let price = ''
  if (input.unitPrice != null) {
    price = formatPKR(input.unitPrice) + (qty > 1 ? ' each' : '')
    if (input.regularUnitPrice && input.regularUnitPrice > input.unitPrice) {
      price += ` (regular ${formatPKR(input.regularUnitPrice)})`
    }
  } else {
    price = 'Please share the price'
  }
  return fillTemplate(input.template || DEFAULT_ORDER_TEMPLATE, {
    product: input.productName,
    sku: input.sku ?? '',
    options: input.options.map((o) => `${o.name}: ${o.value}`).join('\n'),
    quantity: qty,
    price,
    total: input.unitPrice != null && qty > 1 ? formatPKR(input.unitPrice * qty) : '',
    url: input.url,
  })
}

export function buildQuestionMessage(productName: string, url: string): string {
  return `Hello Looma Comfort, I have a question about *${productName}*:\n${url}`
}

export function buildAvailabilityMessage(productName: string, url: string): string {
  return `Hello Looma Comfort, is *${productName}* available? Please let me know when I can order it.\n${url}`
}

export interface ListItem {
  name: string
  options: { name: string; value: string }[]
  price: number | null
  url: string
}

export function buildListMessage(items: ListItem[]): string {
  const capped = items.slice(0, 15)
  const body = capped
    .map((item, i) => {
      const lines = [`${i + 1}. *${item.name}*`]
      if (item.options.length) lines.push(`   ${item.options.map((o) => `${o.name}: ${o.value}`).join(' · ')}`)
      lines.push(`   ${item.price != null ? formatPKR(item.price) : 'Price on request'}`)
      lines.push(`   ${item.url}`)
      return lines.join('\n')
    })
    .join('\n\n')
  const total = capped.reduce((s, i) => s + (i.price ?? 0), 0)
  return `Hello Looma Comfort, I'd like to ask about these pieces:\n\n${body}\n\nEstimated total: ${formatPKR(total)}\n\nPlease share availability and delivery details.`
}

export function buildCustomOrderMessage(base: string, fields: Record<string, string>): string {
  const lines = Object.entries(fields)
    .filter(([, v]) => v && v.trim())
    .map(([k, v]) => `${k}: ${v.trim()}`)
  return [base, '', ...lines].join('\n').trim()
}
