import { useCallback, useEffect, useState } from "react"

import type { Transaction } from "../models/transaction"
import { fetchTransaction } from "../services/transaction-service"

type TransactionState =
  | { status: "loading" }
  | { status: "not-found" }
  | { status: "error" }
  | { status: "success"; transaction: Transaction }

export const useTransaction = (id: string) => {
  const [result, setResult] = useState<{ id: string; state: TransactionState }>({ id, state: { status: "loading" } })
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setResult({ id, state: { status: "loading" } })

    fetchTransaction(id, controller.signal)
      .then((transaction) => {
        if (controller.signal.aborted) return
        setResult({ id, state: transaction ? { status: "success", transaction } : { status: "not-found" } })
      })
      .catch(() => {
        if (!controller.signal.aborted) setResult({ id, state: { status: "error" } })
      })

    return () => controller.abort()
  }, [id, reloadKey])

  const reload = useCallback(() => setReloadKey((key) => key + 1), [])
  const state: TransactionState = result.id === id ? result.state : { status: "loading" }

  return { state, reload }
}
