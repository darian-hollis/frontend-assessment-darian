export const toCents = (dollars: number): number => Math.round(dollars * 100)

export const fromCents = (cents: number): number => cents / 100

// Parses "12.34" into cents without floats (0.29 * 100 is 28.999...)
export const parseCents = (value: string): number | null => {
  const match = /^(\d{1,13})(?:\.(\d{1,2}))?$/.exec(value)
  if (!match) return null

  const [, dollars, cents = ""] = match
  return Number(dollars) * 100 + Number(cents.padEnd(2, "0"))
}

export const percentOfCents = (cents: number, basisPoints: number): number =>
  Math.round((cents * basisPoints) / 10_000)
