import { describe, expect, it } from "vitest"

import { parseListQuery } from "./validation.js"

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
