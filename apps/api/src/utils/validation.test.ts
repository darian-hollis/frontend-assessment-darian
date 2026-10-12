import { describe, expect, it } from "vitest"

import { parseListQuery, parseNewTransaction } from "./validation.js"

describe("parseListQuery", () => {
  it("uses defaults when nothing is passed", () => {
    expect(parseListQuery({})).toEqual({ ok: true, value: { page: 1, pageSize: 20, q: "" } })
  })

  it("parses valid values and trims the search", () => {
    expect(parseListQuery({ page: "3", pageSize: "50", q: "  visa " })).toEqual({
      ok: true,
      value: { page: 3, pageSize: 50, q: "visa" },
    })
  })

  it.each([["0"], ["-1"], ["1.5"], ["abc"], ["9999999"]])("rejects page %s", (page) => {
    expect(parseListQuery({ page }).ok).toBe(false)
  })

  it.each([["0"], ["101"], ["ten"]])("rejects pageSize %s", (pageSize) => {
    expect(parseListQuery({ pageSize }).ok).toBe(false)
  })

  it("rejects array and object params", () => {
    expect(parseListQuery({ q: ["a", "b"] }).ok).toBe(false)
    expect(parseListQuery({ page: { $gt: "1" } }).ok).toBe(false)
  })

  it("rejects control characters in the search", () => {
    expect(parseListQuery({ q: "visa\napproved" }).ok).toBe(false)
  })

  it("rejects overly long searches", () => {
    expect(parseListQuery({ q: "a".repeat(101) }).ok).toBe(false)
  })
})

describe("parseNewTransaction", () => {
  const valid = { merchantName: "  Blue Ridge Outfitters ", cardBrand: "VISA", amount: "12.34" }

  it("accepts a valid body, trims the merchant and converts the amount to cents", () => {
    expect(parseNewTransaction(valid)).toEqual({
      ok: true,
      value: { merchantName: "Blue Ridge Outfitters", cardBrand: "VISA", amountCents: 1234 },
    })
  })

  it("reports every invalid field at once", () => {
    const result = parseNewTransaction({ merchantName: "   ", cardBrand: "PAYPAL", amount: "0" })

    expect(result.ok).toBe(false)
    if (!result.ok) expect(Object.keys(result.error).sort()).toEqual(["amount", "cardBrand", "merchantName"])
  })

  it.each([undefined, null, "text", ["array"]])("rejects a non-object body (%j)", (body) => {
    expect(parseNewTransaction(body).ok).toBe(false)
  })

  it.each([
    { amount: 12.34, reason: "a number instead of a string" },
    { amount: "12.345", reason: "more than 2 decimals" },
    { amount: "-1", reason: "a negative amount" },
    { amount: "1000000.01", reason: "more than the maximum" },
    { amount: "NaN", reason: "not a number" },
  ])("rejects $reason", ({ amount }) => {
    expect(parseNewTransaction({ ...valid, amount }).ok).toBe(false)
  })

  it.each(["12000000", "12000000000000000"])("explains the limit for very large amounts (%s)", (amount) => {
    expect(parseNewTransaction({ ...valid, amount })).toEqual({
      ok: false,
      error: { amount: "Amount can't be more than $1,000,000.00" },
    })
  })

  it("counts merchant name length in characters, not UTF-16 units", () => {
    expect(parseNewTransaction({ ...valid, merchantName: "🍕".repeat(60) }).ok).toBe(true)
    expect(parseNewTransaction({ ...valid, merchantName: "🍕".repeat(101) }).ok).toBe(false)
  })

  it("rejects overly long merchant names and control characters", () => {
    expect(parseNewTransaction({ ...valid, merchantName: "a".repeat(101) }).ok).toBe(false)
    expect(parseNewTransaction({ ...valid, merchantName: "Bad\u0000Name" }).ok).toBe(false)
    expect(parseNewTransaction({ ...valid, merchantName: "Evil\u202Eredoc" }).ok).toBe(false)
    expect(parseNewTransaction({ ...valid, merchantName: "Zero\u200Bwidth" }).ok).toBe(false)
    expect(parseNewTransaction({ ...valid, merchantName: "Line\u2028break" }).ok).toBe(false)
    expect(parseNewTransaction({ ...valid, merchantName: "Amazon\u200F" }).ok).toBe(false)
    expect(parseNewTransaction({ ...valid, merchantName: "Ama\uFEFFzon" }).ok).toBe(false)
    expect(parseNewTransaction({ ...valid, merchantName: "Café & Co." }).ok).toBe(true)
    expect(parseNewTransaction({ ...valid, merchantName: "می\u200Cخانه" }).ok).toBe(true)
  })
})
