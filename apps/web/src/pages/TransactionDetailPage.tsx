import { useParams } from "react-router-dom"
import { Button, Card, Descriptions, Result, Skeleton, Tag } from "antd"

import { BackLink } from "../components/BackLink"
import { useTransaction } from "../hooks/useTransaction"
import type { Transaction } from "../models/transaction"
import { formatCurrency, formatDateTime, formatPercent } from "../utils/format"
import { statusTagColor } from "../utils/status"

const TransactionDetails = ({ transaction }: { transaction: Transaction }) => (
  <Descriptions
    column={1}
    bordered
    items={[
      { key: "merchant", label: "Merchant", children: transaction.merchantName },
      { key: "card", label: "Card brand", children: transaction.cardBrand },
      { key: "amount", label: "Amount", children: formatCurrency(transaction.amount) },
      {
        key: "surcharge",
        label: "Surcharge",
        children: `${formatCurrency(transaction.surcharge)} (${formatPercent(transaction.surchargeRate)})`,
      },
      { key: "total", label: "Total charged", children: <strong>{formatCurrency(transaction.total)}</strong> },
      {
        key: "status",
        label: "Status",
        children: <Tag color={statusTagColor(transaction.status)}>{transaction.status}</Tag>,
      },
      { key: "date", label: "Created", children: formatDateTime(transaction.createdAt) },
    ]}
  />
)

export const TransactionDetailPage = () => {
  const { id = "" } = useParams()
  const { state, reload } = useTransaction(id)
  const backLink = <BackLink>Back to transactions</BackLink>

  if (state.status === "not-found") {
    return (
      <Result
        status="404"
        title={<h1 className="result-title">Transaction not found</h1>}
        subTitle={`We couldn't find a transaction with the id "${id}".`}
        extra={backLink}
      />
    )
  }

  if (state.status === "error") {
    return (
      <Result
        status="error"
        title={<h1 className="result-title">We couldn't load this transaction</h1>}
        subTitle="Something went wrong on our side. Please try again."
        extra={
          <>
            <Button type="primary" onClick={reload}>
              Retry
            </Button>
            {backLink}
          </>
        }
      />
    )
  }

  return (
    <div className="transaction-detail">
      {backLink}
      <Card title={<h1 className="detail-title">{id}</h1>}>
        {state.status === "loading" ? (
          <Skeleton active paragraph={{ rows: 6 }} />
        ) : (
          <TransactionDetails transaction={state.transaction} />
        )}
      </Card>
    </div>
  )
}
