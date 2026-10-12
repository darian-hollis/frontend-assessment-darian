import { afterEach, describe, expect, it, vi } from "vitest"

// Formatters are built on import, so set TZ first and re-import
const loadFormat = async (timeZone: string) => {
  process.env.TZ = timeZone
  vi.resetModules()
  return import("./format")
}

describe("format", () => {
  const originalTz = process.env.TZ

  afterEach(() => {
    if (originalTz === undefined) delete process.env.TZ
    else process.env.TZ = originalTz
  })

  it("shows the stored UTC date for users in US time", async () => {
    const { formatDate, formatDateTime } = await loadFormat("America/New_York")

    expect(formatDate("2026-06-29T00:00:00.000Z")).toBe("6/29/2026")
    expect(formatDateTime("2026-06-29T00:00:00.000Z")).toBe("Jun 29, 2026, 12:00 AM UTC")
  })

  it("formats money and rates", async () => {
    const { formatCurrency, formatPercent } = await loadFormat("America/New_York")

    expect(formatCurrency(1665.23)).toBe("$1,665.23")
    expect(formatPercent(0.035)).toBe("3.5%")
    expect(formatPercent(0.03)).toBe("3.0%")
  })

  it("shows a dash for an invalid date instead of crashing", async () => {
    const { formatDate, formatDateTime } = await loadFormat("America/New_York")

    expect(formatDate("not a date")).toBe("—")
    expect(formatDateTime("")).toBe("—")
  })
})
