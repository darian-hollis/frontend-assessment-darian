import { TransactionStatus } from "../models/transaction"

const STATUS_COLORS: Record<TransactionStatus, string> = {
  [TransactionStatus.APPROVED]: "success",
  [TransactionStatus.DECLINED]: "error",
  [TransactionStatus.PENDING]: "warning",
  [TransactionStatus.REFUNDED]: "default",
}

export const statusTagColor = (status: TransactionStatus): string => STATUS_COLORS[status] ?? "default"
