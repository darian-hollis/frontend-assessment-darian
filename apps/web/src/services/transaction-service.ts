import type { CardBrand, Transaction } from "../models/transaction"

const API_BASE = "/api"

export const fetchTransactions = async (): Promise<Transaction[]> => {
  const rsp = await fetch(`${API_BASE}/transactions`)
  const data = await rsp.json()
  return data.transactions
}

export interface NewTransactionInput {
  merchantName: string
  cardBrand: CardBrand
  amount: number
}

export const createTransaction = async (input: NewTransactionInput): Promise<Transaction> => {
  const rsp = await fetch(`${API_BASE}/transactions`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  })
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
