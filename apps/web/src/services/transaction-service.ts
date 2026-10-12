import type { CardBrand, Transaction, TransactionPage } from "../models/transaction"

const API_BASE = "/api"

export interface TransactionQuery {
  page: number
  pageSize: number
  q: string
}

export const fetchTransactions = async (
  { page, pageSize, q }: TransactionQuery,
  signal?: AbortSignal
): Promise<TransactionPage> => {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
  if (q) params.set("q", q)

  const rsp = await fetch(`${API_BASE}/transactions?${params}`, { signal })
  if (!rsp.ok) {
    throw new Error(`Failed to load transactions (${rsp.status})`)
  }
  return rsp.json()
}

export interface NewTransactionInput {
  merchantName: string
  cardBrand: CardBrand
  amount: string
}

type FieldErrors = Partial<Record<keyof NewTransactionInput, string>>

export class ValidationError extends Error {
  fields: FieldErrors

  constructor(fields: FieldErrors) {
    super("Invalid transaction")
    this.fields = fields
  }
}

const CREATE_TIMEOUT_MS = 15_000

export const createTransaction = async (input: NewTransactionInput): Promise<Transaction> => {
  const rsp = await fetch(`${API_BASE}/transactions`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
    signal: AbortSignal.timeout(CREATE_TIMEOUT_MS),
  })
  if (rsp.status === 400) {
    const body = await rsp.json().catch(() => null)
    throw new ValidationError(body?.fields ?? {})
  }
  if (!rsp.ok) {
    throw new Error(`Failed to create transaction (${rsp.status})`)
  }
  return rsp.json()
}

export const fetchTransaction = async (id: string, signal?: AbortSignal): Promise<Transaction | null> => {
  const rsp = await fetch(`${API_BASE}/transactions/${encodeURIComponent(id)}`, { signal })
  if (rsp.status === 404) return null
  if (!rsp.ok) {
    throw new Error(`Failed to load transaction (${rsp.status})`)
  }
  return rsp.json()
}
