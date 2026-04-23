const SCALE = 100

export function parseMoney(value: string | number | null | undefined): number {
  if (value === null || value === undefined) {
    return 0
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? Math.round(value * SCALE) / SCALE : 0
  }

  const normalized = value.trim().replace(/\s+/g, '').replace(',', '.')
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
