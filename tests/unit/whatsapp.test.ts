import { describe, expect, it } from 'vitest'
import { formatPKR, normalizePkPhone, slugify } from '@/lib/format'
import { buildListMessage, buildOrderMessage, fillTemplate, normalizeWhatsAppNumber, whatsappLink } from '@/lib/whatsapp'

describe('format', () => {
  it('formats rupees with international grouping', () => {
    expect(formatPKR(45499)).toBe('Rs. 45,499')
    expect(formatPKR(125000)).toBe('Rs. 125,000')
  })
  it('slugifies names', () => {
    expect(slugify('Round Sheesham Coffee Table')).toBe('round-sheesham-coffee-table')
    expect(slugify('Cabinets & Storage')).toBe('cabinets-and-storage')
  })
  it('normalises Pakistani mobile numbers', () => {
    expect(normalizePkPhone('0300 1234567')).toBe('+923001234567')
    expect(normalizePkPhone('+92 300-1234567')).toBe('+923001234567')
    expect(normalizePkPhone('12345')).toBeNull()
  })
})

describe('whatsapp', () => {
  it('normalises numbers for wa.me', () => {
    expect(normalizeWhatsAppNumber('+92 300 1234567')).toBe('923001234567')
    expect(normalizeWhatsAppNumber('03001234567')).toBe('923001234567')
    expect(normalizeWhatsAppNumber('')).toBeNull()
  })

  it('builds encoded wa.me links', () => {
    expect(whatsappLink('+92 300 1234567', 'Hi & bye')).toBe('https://wa.me/923001234567?text=Hi%20%26%20bye')
    expect(whatsappLink(null, 'x')).toBeNull()
  })

  it('drops template lines whose placeholders are empty', () => {
    expect(fillTemplate('A {{x}}\nSKU: {{sku}}\nEnd', { x: 1, sku: '' })).toBe('A 1\nEnd')
  })

  it('builds the order message with options, quantity and total', () => {
    const msg = buildOrderMessage({
      productName: 'Round Sheesham Coffee Table',
      sku: 'LC-CT-401',
      options: [
        { name: 'Size', value: '36" Round' },
        { name: 'Finish', value: 'Dark Walnut' },
      ],
      quantity: 2,
      unitPrice: 45499,
      regularUnitPrice: 52999,
      url: 'https://loomacomfort.com/products/round-sheesham-coffee-table?size=36-round',
    })
    expect(msg).toContain('*Round Sheesham Coffee Table*')
    expect(msg).toContain('Size: 36" Round\nFinish: Dark Walnut')
    expect(msg).toContain('Quantity: 2')
    expect(msg).toContain('Price: Rs. 45,499 each (regular Rs. 52,999)')
    expect(msg).toContain('Total: Rs. 90,998')
    expect(msg).toContain('SKU: LC-CT-401')
    expect(msg).toContain('https://loomacomfort.com/products/round-sheesham-coffee-table?size=36-round')
  })

  it('omits total for a single item and handles price on request', () => {
    const msg = buildOrderMessage({ productName: 'Chair', options: [], quantity: 1, unitPrice: null, url: 'u' })
    expect(msg).not.toContain('Total:')
    expect(msg).toContain('Price: Please share the price')
    expect(msg).not.toContain('SKU:')
  })

  it('lists several products with an estimated total', () => {
    const msg = buildListMessage([
      { name: 'A', options: [], price: 1000, url: 'u1' },
      { name: 'B', options: [{ name: 'Size', value: 'King' }], price: 2500, url: 'u2' },
    ])
    expect(msg).toContain('1. *A*')
    expect(msg).toContain('2. *B*\n   Size: King')
    expect(msg).toContain('Estimated total: Rs. 3,500')
  })
})
