const pkr = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })

/** Rs. 45,499 (international grouping, no decimals). */
export function formatPKR(amount: number): string {
  return `Rs. ${pkr.format(Math.round(amount))}`
}

export function formatNumber(n: number): string {
  return pkr.format(n)
}

export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/["'’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90)
}

const TZ = 'Asia/Karachi'

/** "31 October" in Pakistan time. */
export function formatDayMonth(iso: string): string {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', timeZone: TZ }).format(new Date(iso))
}

/** "12 Oct 2026" in Pakistan time. */
export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: TZ }).format(
    new Date(iso),
  )
}

/** "12 Oct 2026, 4:05 pm" in Pakistan time. */
export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: TZ,
  }).format(new Date(iso))
}

/** Converts a value from <input type="datetime-local"> (entered in Pakistan time, UTC+5) to ISO. */
export function pktLocalToIso(local: string): string | null {
  if (!local) return null
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(local)
  if (!m) return null
  const [, y, mo, d, h, mi] = m.map(Number)
  return new Date(Date.UTC(y, mo - 1, d, h - 5, mi)).toISOString()
}

/** ISO → value for <input type="datetime-local"> in Pakistan time. */
export function isoToPktLocal(iso: string | null | undefined): string {
  if (!iso) return ''
  const t = new Date(new Date(iso).getTime() + 5 * 3600 * 1000)
  return t.toISOString().slice(0, 16)
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`
}

/** Normalises a Pakistani mobile number to +92XXXXXXXXXX, or null if it isn't one. */
export function normalizePkPhone(input: string): string | null {
  const digits = input.replace(/[^\d]/g, '')
  let local: string | null = null
  if (/^03\d{9}$/.test(digits)) local = digits.slice(1)
  else if (/^923\d{9}$/.test(digits)) local = digits.slice(2)
  else if (/^00923\d{9}$/.test(digits)) local = digits.slice(4)
  else if (/^3\d{9}$/.test(digits)) local = digits
  return local ? `+92${local}` : null
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('')
}
