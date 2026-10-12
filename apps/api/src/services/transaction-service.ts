import { TransactionStatus } from "../models/transaction.js"
import type { Transaction } from "../models/transaction.js"
import { loadTransactions } from "../data/transactions.js"
import { fromCents, percentOfCents, toCents } from "../utils/money.js"
import type { ListQuery, NewTransactionInput } from "../utils/validation.js"

// Assumption: seed rates vary (2.5-3.5%) with no rule, so new transactions use a flat 3%
const SURCHARGE_RATE_BPS = 300

export interface TransactionSummary {
  approvedCount: number
  totalProcessed: number
}

export interface TransactionPage {
  items: Transaction[]
  page: number
  pageSize: number
  q: string
  total: number
  summary: TransactionSummary
}

// Only approved transactions count as processed
export const summarize = (rows: Transaction[]): TransactionSummary => {
  let approvedCount = 0
  let totalCents = 0
  for (const t of rows) {
    if (t.status !== TransactionStatus.APPROVED) continue
    approvedCount++
    totalCents += toCents(t.total)
  }

  return { approvedCount, totalProcessed: fromCents(totalCents) }
}

// Newline-joined so a search term can't match across two fields
const toSearchText = (t: Transaction): string =>
  [t.id, t.merchantName, t.cardBrand, t.status].join("\n").toLowerCase()

export const createTransactionService = (seed: Transaction[] = loadTransactions()) => {
  const transactions = [...seed]
  const byId = new Map(transactions.map((t) => [t.id, t]))
  const searchText = new WeakMap(transactions.map((t) => [t, toSearchText(t)]))

  const count = (): number => transactions.length

  const getById = (id: string): Transaction | undefined => byId.get(id)

  const list = ({ page, pageSize, q }: ListQuery): TransactionPage => {
    const term = q.toLowerCase()
    const matches = term ? transactions.filter((t) => searchText.get(t)?.includes(term)) : transactions
    const start = (page - 1) * pageSize

    return {
      items: matches.slice(start, start + pageSize),
      page,
      pageSize,
      q,
      total: matches.length,
      summary: summarize(matches),
    }
  }

  const create = ({ merchantName, cardBrand, amountCents }: NewTransactionInput): Transaction => {
    const surchargeCents = percentOfCents(amountCents, SURCHARGE_RATE_BPS)
    const transaction: Transaction = {
      id: `txn_${String(transactions.length + 1).padStart(6, "0")}`,
      merchantName,
      cardBrand,
      amount: fromCents(amountCents),
      surchargeRate: SURCHARGE_RATE_BPS / 10_000,
      surcharge: fromCents(surchargeCents),
      total: fromCents(amountCents + surchargeCents),
      status: TransactionStatus.PENDING,
      createdAt: new Date().toISOString(),
    }
    transactions.unshift(transaction)
    byId.set(transaction.id, transaction)
    searchText.set(transaction, toSearchText(transaction))
    return transaction
  }

  return { count, getById, list, create }
}

export type TransactionService = ReturnType<typeof createTransactionService>
