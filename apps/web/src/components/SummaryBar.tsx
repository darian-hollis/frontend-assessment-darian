import { Statistic } from "antd"

import type { TransactionSummary } from "../models/transaction"

interface SummaryBarProps {
  total: number
  summary: TransactionSummary
  search?: string
}

export const SummaryBar = ({ total, summary, search }: SummaryBarProps) => {
  return (
    <div className="summary-bar">
      <Statistic
        title={
          <>
            Transactions {search && <span className="muted">matching &ldquo;{search}&rdquo;</span>}
          </>
        }
        value={total}
      />
      <Statistic title="Approved" value={summary.approvedCount} />
      <Statistic
        title={
          <>
            Total processed <span className="muted">(approved, incl. surcharge)</span>
          </>
        }
        value={summary.totalProcessed}
        precision={2}
        prefix="$"
      />
    </div>
  )
}
