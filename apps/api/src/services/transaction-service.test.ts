import { describe, expect, it } from "vitest"

import { CardBrand, TransactionStatus } from "../models/transaction.js"
import type { Transaction } from "../models/transaction.js"
import { createTransactionService, summarize } from "./transaction-service.js"

const makeTransaction = (overrides: Partial<Transaction>): Transaction => ({
  id: "txn_000001",
  merchantName: "Test Merchant",
  cardBrand: CardBrand.VISA,
  amount: 100,
  surchargeRate: 0.03,
  surcharge: 3,
  total: 103,
  status: TransactionStatus.APPROVED,
  createdAt: "2026-01-01T00:00:00.000Z",
  ...overrides,
})

describe("summarize", () => {
  it("only counts approved transactions towards the total", () => {
    const summary = summarize([
      makeTransaction({ total: 103 }),
      makeTransaction({ status: TransactionStatus.DECLINED, total: 50 }),
      makeTransaction({ status: TransactionStatus.REFUNDED, total: 20 }),
      makeTransaction({ status: TransactionStatus.PENDING, total: 10 }),
    ])

    expect(summary).toEqual({ approvedCount: 1, totalProcessed: 103 })
  })

  it("includes the surcharge by summing total, not amount", () => {
    const summary = summarize([makeTransaction({ amount: 100, surcharge: 3.5, total: 103.5 })])

    expect(summary.totalProcessed).toBe(103.5)
  })

  it("adds up cents exactly", () => {
    const rows = Array.from({ length: 10 }, () => makeTransaction({ total: 0.1 }))

    expect(summarize(rows).totalProcessed).toBe(1)
  })

  it("handles an empty list", () => {
    expect(summarize([])).toEqual({ approvedCount: 0, totalProcessed: 0 })
  })
})

describe("list", () => {
  const seed = Array.from({ length: 25 }, (_, i) =>
    makeTransaction({
      id: `txn_${String(25 - i).padStart(6, "0")}`,
      merchantName: i % 2 === 0 ? "Blue Ridge Outfitters" : "Quail Run Winery",
    })
  )
  const service = createTransactionService(seed)

  it("returns the requested page and the total across all pages", () => {
    const result = service.list({ page: 2, pageSize: 10, q: "" })

    expect(result.items.map((t) => t.id)).toEqual(seed.slice(10, 20).map((t) => t.id))
    expect(result).toMatchObject({ page: 2, pageSize: 10, total: 25 })
  })

  it("returns a short last page and an empty page past the end", () => {
    expect(service.list({ page: 3, pageSize: 10, q: "" }).items).toHaveLength(5)
    expect(service.list({ page: 4, pageSize: 10, q: "" })).toMatchObject({ items: [], total: 25 })
  })

  it("searches case-insensitively across the whole dataset before paging", () => {
    const result = service.list({ page: 1, pageSize: 5, q: "quail" })

    expect(result.total).toBe(12)
    expect(result.items).toHaveLength(5)
    expect(result.items.every((t) => t.merchantName === "Quail Run Winery")).toBe(true)
  })

  it("matches on id, card brand and status too", () => {
    expect(service.list({ page: 1, pageSize: 50, q: "txn_000007" }).total).toBe(1)
    expect(service.list({ page: 1, pageSize: 50, q: "visa" }).total).toBe(25)
    expect(service.list({ page: 1, pageSize: 50, q: "approved" }).total).toBe(25)
    expect(service.list({ page: 1, pageSize: 50, q: "winery visa" }).total).toBe(0)
  })

  it("summarises the search results, not just the current page", () => {
    const result = service.list({ page: 1, pageSize: 5, q: "quail" })

    expect(result.summary).toEqual({ approvedCount: 12, totalProcessed: 1236 })
  })
})
