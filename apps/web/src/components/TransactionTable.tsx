import { useMemo } from "react"
import type { MouseEvent } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { Table, Tag } from "antd"
import type { TableColumnsType } from "antd"

import type { Transaction } from "../models/transaction"
import { formatCurrency, formatDate } from "../utils/format"
import { transactionPath } from "../utils/routes"
import { statusTagColor } from "../utils/status"

interface TransactionTableProps {
  transactions: Transaction[]
  loading: boolean
  page: number
  pageSize: number
  total: number
  error: boolean
  onPageChange: (page: number) => void
}

const columns = (from: string): TableColumnsType<Transaction> => [
  {
    title: "Transaction",
    dataIndex: "id",
    render: (id: string) => (
      // The row is clickable too, so don't navigate twice
      <Link to={transactionPath(id)} state={{ from }} className="mono" onClick={(e) => e.stopPropagation()}>
        {id}
      </Link>
    ),
  },
  { title: "Merchant", dataIndex: "merchantName" },
  { title: "Card", dataIndex: "cardBrand" },
  { title: "Amount", dataIndex: "amount", align: "right", render: formatCurrency },
  { title: "Surcharge", dataIndex: "surcharge", align: "right", render: formatCurrency },
  { title: "Total", dataIndex: "total", align: "right", render: formatCurrency },
  {
    title: "Status",
    dataIndex: "status",
    render: (status: Transaction["status"]) => <Tag color={statusTagColor(status)}>{status}</Tag>,
  },
  { title: "Date (UTC)", dataIndex: "createdAt", render: formatDate },
]

export const TransactionTable = ({
  transactions,
  loading,
  page,
  pageSize,
  total,
  error,
  onPageChange,
}: TransactionTableProps) => {
  const location = useLocation()
  const navigate = useNavigate()
  const from = location.pathname + location.search
  const tableColumns = useMemo(() => columns(from), [from])

  const handleRowClick = (event: MouseEvent, transaction: Transaction) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    if (window.getSelection()?.toString()) return
    navigate(transactionPath(transaction.id), { state: { from } })
  }

  return (
    <Table
      rowKey="id"
      size="middle"
      columns={tableColumns}
      dataSource={transactions}
      loading={loading}
      locale={{ emptyText: error ? "Transactions couldn't be loaded" : "No transactions found" }}
      rowClassName="clickable-row"
      onRow={(transaction) => ({ onClick: (event) => handleRowClick(event, transaction) })}
      pagination={{
        current: page,
        pageSize,
        total,
        showSizeChanger: false,
        showTotal: (count) => `${count.toLocaleString("en-US")} transactions`,
        onChange: onPageChange,
      }}
    />
  )
}
