export enum CardBrand {
  VISA = "VISA",
  MASTERCARD = "MASTERCARD",
  AMEX = "AMEX",
  DISCOVER = "DISCOVER",
}

export enum TransactionStatus {
  APPROVED = "APPROVED",
  DECLINED = "DECLINED",
  REFUNDED = "REFUNDED",
  PENDING = "PENDING",
}

export interface Transaction {
  id: string
  merchantName: string
  cardBrand: CardBrand
  amount: number
  surchargeRate: number
  surcharge: number
  total: number
  status: TransactionStatus
  createdAt: string
}

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
