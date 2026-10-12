import { useCallback, useEffect, useState } from "react"

import type { TransactionPage } from "../models/transaction"
import { fetchTransactions } from "../services/transaction-service"
import type { TransactionQuery } from "../services/transaction-service"

export const useTransactions = ({ page, pageSize, q }: TransactionQuery, enabled = true) => {
  const [data, setData] = useState<TransactionPage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (!enabled) return
    const controller = new AbortController()
    setLoading(true)
    setError(null)

    fetchTransactions({ page, pageSize, q }, controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return
        setData(result)
        setLoading(false)
      })
      .catch(() => {
        if (controller.signal.aborted) return
        setData(null)
        setError("We couldn't load transactions. Please try again.")
        setLoading(false)
      })

    return () => controller.abort()
  }, [page, pageSize, q, reloadKey, enabled])

  const reload = useCallback(() => setReloadKey((key) => key + 1), [])

  return { data, loading, error, reload }
}
