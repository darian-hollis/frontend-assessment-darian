import { useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import { Alert, Button, Input } from "antd"
import { SearchOutlined } from "@ant-design/icons"

import { SummaryBar } from "../components/SummaryBar"
import { TransactionTable } from "../components/TransactionTable"
import { useDebouncedValue } from "../hooks/useDebouncedValue"
import { useTransactions } from "../hooks/useTransactions"

const PAGE_SIZE = 20
const MAX_SEARCH_LENGTH = 100
const SEARCH_DELAY_MS = 300

const parsePage = (value: string | null): number =>
  value && /^\d{1,6}$/.test(value) && Number(value) > 0 ? Number(value) : 1

const buildParams = (q: string, page: number) => {
  const params = new URLSearchParams()
  if (q.trim()) params.set("q", q)
  if (page > 1) params.set("page", String(page))
  return params
}

export const TransactionsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const q = searchParams.get("q") ?? ""
  const page = parsePage(searchParams.get("page"))

  const searchQuery = q.replace(/\p{Cc}/gu, " ").trim().slice(0, MAX_SEARCH_LENGTH).trim()
  const settled = useDebouncedValue(searchQuery, SEARCH_DELAY_MS) === searchQuery
  const { data, loading, error, reload } = useTransactions({ page, pageSize: PAGE_SIZE, q: searchQuery }, settled)

  useEffect(() => {
    if (!data || data.page !== page || data.q !== searchQuery) return
    const lastPage = Math.max(1, Math.ceil(data.total / PAGE_SIZE))
    if (page > lastPage) {
      setSearchParams(buildParams(q, lastPage), { replace: true })
    }
  }, [data, page, q, searchQuery, setSearchParams])

  const handleSearchChange = (value: string) => {
    // New search pushes a history entry so Back returns to where you were; refining replaces it
    const refining = q.trim() !== "" && page === 1
    setSearchParams(buildParams(value, 1), { replace: refining })
  }

  const handlePageChange = (nextPage: number) => {
    setSearchParams(buildParams(q, nextPage))
  }

  return (
    <>
      <header className="app-header">
        <h1>Transactions</h1>
        <Input
          style={{ width: 320 }}
          prefix={<SearchOutlined />}
          allowClear
          maxLength={MAX_SEARCH_LENGTH}
          aria-label="Search transactions"
          placeholder="Search merchant, id, card, status..."
          value={q}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
      </header>

      {error && (
        <Alert
          className="page-alert"
          type="error"
          showIcon
          message={error}
          action={
            <Button size="small" onClick={reload}>
              Retry
            </Button>
          }
        />
      )}

      {data && <SummaryBar total={data.total} summary={data.summary} search={data.q} />}
      <span className="sr-only" role="status">
        {data && `${data.total.toLocaleString("en-US")} transactions found`}
      </span>

      <TransactionTable
        transactions={data?.items ?? []}
        loading={loading || !settled}
        page={page}
        pageSize={PAGE_SIZE}
        total={data?.total ?? 0}
        error={Boolean(error)}
        onPageChange={handlePageChange}
      />
    </>
  )
}
