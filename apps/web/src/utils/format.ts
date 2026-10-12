const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })
const percent = new Intl.NumberFormat("en-US", { style: "percent", minimumFractionDigits: 1 })

// Stored as UTC; formatting in local time shows the previous day in US time zones
const date = new Intl.DateTimeFormat("en-US", { timeZone: "UTC" })
const dateTime = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" })

export const formatCurrency = (value: number): string => currency.format(value)

const parseDate = (iso: string): Date | null => {
  const value = new Date(iso)
  return Number.isNaN(value.getTime()) ? null : value
}

export const formatDate = (iso: string): string => {
  const value = parseDate(iso)
  return value ? date.format(value) : "—"
}

export const formatDateTime = (iso: string): string => {
  const value = parseDate(iso)
  return value ? `${dateTime.format(value)} UTC` : "—"
}

export const formatPercent = (rate: number): string => percent.format(rate)
