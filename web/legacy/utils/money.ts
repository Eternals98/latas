const SCALE = 100

function toCanonicalMoneyString(value: string): string {
  const cleaned = value.trim().replace(/\s+/g, '').replace(/[^\d.,-]/g, '')
  if (!cleaned) {
    return ''
  }

  const isNegative = cleaned.startsWith('-')
  const hasComma = cleaned.includes(',')
  const dotCount = (cleaned.match(/\./g) ?? []).length
  let rawInteger = cleaned
  let rawDecimal = ''

  if (hasComma) {
    const separatorIndex = cleaned.lastIndexOf(',')
    rawInteger = cleaned.slice(0, separatorIndex).replace(/\./g, '')
    rawDecimal = cleaned.slice(separatorIndex + 1)
  } else if (dotCount > 1) {
    rawInteger = cleaned.replace(/\./g, '')
  } else if (dotCount === 1) {
    const separatorIndex = cleaned.lastIndexOf('.')
    const before = cleaned.slice(0, separatorIndex)
    const after = cleaned.slice(separatorIndex + 1)
    if (after.length === 3) {
      rawInteger = `${before}${after}`.replace(/\./g, '')
    } else {
      rawInteger = before
      rawDecimal = after
    }
  }

  let integerDigits = rawInteger.replace(/[^\d]/g, '')
  const decimalDigits = rawDecimal.replace(/[^\d]/g, '')

  if (!integerDigits && !decimalDigits) {
    return ''
  }

  integerDigits = integerDigits.replace(/^0+(?=\d)/, '')
  if (!integerDigits) {
    integerDigits = '0'
  }

  const decimalPart = decimalDigits ? `.${decimalDigits}` : ''
  const sign = isNegative ? '-' : ''
  return `${sign}${integerDigits}${decimalPart}`
}

export function maskMoneyInput(value: string): string {
  const cleaned = value.trim().replace(/\s+/g, '').replace(/[^\d,]/g, '')
  if (!cleaned) {
    return ''
  }

  const trailingSeparator = /,$/.test(cleaned)
  const separatorIndex = cleaned.lastIndexOf(',')
  const rawInteger = separatorIndex >= 0 ? cleaned.slice(0, separatorIndex) : cleaned
  const rawDecimal = separatorIndex >= 0 ? cleaned.slice(separatorIndex + 1) : ''

  let integerDigits = rawInteger.replace(/[^\d]/g, '')
  let decimalDigits = rawDecimal.replace(/[^\d]/g, '').slice(0, 2)

  if (!integerDigits) {
    integerDigits = '0'
  }

  integerDigits = integerDigits.replace(/^0+(?=\d)/, '')

  const formattedInteger = integerDigits.replace(/\B(?=(\d{3})+(?!\d))/g, '.')

  if (separatorIndex < 0) {
    return formattedInteger
  }

  if (trailingSeparator) {
    decimalDigits = ''
  }

  return `${formattedInteger},${decimalDigits}`
}

export function parseMoney(value: string | number | null | undefined): number {
  if (value === null || value === undefined) {
    return 0
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? Math.round(value * SCALE) / SCALE : 0
  }

  const normalized = toCanonicalMoneyString(value)
  if (!normalized) {
    return 0
  }

  const numeric = Number(normalized)
  if (!Number.isFinite(numeric)) {
    return 0
  }

  return Math.round(numeric * SCALE) / SCALE
}

export function formatMoney(value: string | number): string {
  const amount = parseMoney(value)
  return new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function sumMoney(values: Array<string | number>): number {
  const cents = values.reduce<number>(
    (acc, current) => acc + Math.round(parseMoney(current) * SCALE),
    0,
  )
  return cents / SCALE
}

export function equalsMoney(left: string | number, right: string | number): boolean {
  const leftCents = Math.round(parseMoney(left) * SCALE)
  const rightCents = Math.round(parseMoney(right) * SCALE)
  return leftCents === rightCents
}

export function toMoneyPayload(value: string | number): string {
  return parseMoney(value).toFixed(2)
}
