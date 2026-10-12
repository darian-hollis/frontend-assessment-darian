import { describe, expect, it } from "vitest"

import { parseCents, percentOfCents } from "./money.js"

describe("parseCents", () => {
  it.each([
    ["12", 1200],
    ["12.5", 1250],
    ["12.34", 1234],
    ["0.29", 29],
    ["1000000.00", 100000000],
  ])("parses %s exactly", (value, cents) => {
    expect(parseCents(value)).toBe(cents)
  })

  it.each([[""], ["abc"], ["12.345"], ["-5"], ["1e3"], [" 12"], ["12."], ["12345678901234"]])(
    "rejects %j",
    (value) => {
      expect(parseCents(value)).toBeNull()
    }
  )
})

describe("percentOfCents", () => {
  it("rounds half up to the nearest cent", () => {
    expect(percentOfCents(161673, 300)).toBe(4850)
    expect(percentOfCents(50, 300)).toBe(2)
    expect(percentOfCents(1150, 350)).toBe(40)
  })
})
