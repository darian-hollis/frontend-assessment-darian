import { CardBrand } from "../models/transaction.js"
import { parseCents } from "./money.js"

type Result<T, E = string> = { ok: true; value: T } | { ok: false; error: E }

export interface ListQuery {
  page: number
  pageSize: number
  q: string
}

const DEFAULT_PAGE_SIZE = 20
const MAX_PAGE_SIZE = 100
const MAX_SEARCH_LENGTH = 100

// Express parses ?q[]=a into an array, so check the type first
const parsePositiveInt = (value: unknown, fallback: number): number | null => {
  if (value === undefined || value === "") return fallback
  if (typeof value !== "string" || !/^\d{1,6}$/.test(value)) return null
  const parsed = Number(value)
  return parsed >= 1 ? parsed : null
}

export const parseListQuery = (query: Record<string, unknown>): Result<ListQuery> => {
  const page = parsePositiveInt(query.page, 1)
  if (page === null) return { ok: false, error: "page must be a positive whole number" }

  const pageSize = parsePositiveInt(query.pageSize, DEFAULT_PAGE_SIZE)
  if (pageSize === null || pageSize > MAX_PAGE_SIZE) {
    return { ok: false, error: `pageSize must be between 1 and ${MAX_PAGE_SIZE}` }
  }

  const q = query.q ?? ""
  if (typeof q !== "string") return { ok: false, error: "q must be a string" }
  if (/\p{Cc}/u.test(q)) return { ok: false, error: "q contains invalid characters" }
  if (q.length > MAX_SEARCH_LENGTH) {
    return { ok: false, error: `q must be ${MAX_SEARCH_LENGTH} characters or fewer` }
  }

  return { ok: true, value: { page, pageSize, q: q.trim() } }
}

export interface NewTransactionInput {
  merchantName: string
  cardBrand: CardBrand
  amountCents: number
}

type FieldErrors = Partial<Record<"merchantName" | "cardBrand" | "amount", string>>

const MAX_MERCHANT_LENGTH = 100
// Blocks control and invisible characters used to spoof names; ZWJ/ZWNJ are allowed as some scripts need them
const hasUnsafeChars = (value: string): boolean =>
  /[\p{Cc}\p{Cs}\p{Zl}\p{Zp}]/u.test(value) || /\p{Cf}/u.test(value.replace(/[\u200C\u200D]/g, ""))
const MAX_AMOUNT_CENTS = 1_000_000_00
const CARD_BRANDS = Object.values(CardBrand) as string[]

export const parseNewTransaction = (body: unknown): Result<NewTransactionInput, FieldErrors> => {
  const input = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {}
  const errors: FieldErrors = {}

  const merchantName = typeof input.merchantName === "string" ? input.merchantName.trim() : ""
  if (!merchantName) {
    errors.merchantName = "Merchant name is required"
  } else if ([...merchantName].length > MAX_MERCHANT_LENGTH) {
    errors.merchantName = `Merchant name must be ${MAX_MERCHANT_LENGTH} characters or fewer`
  } else if (hasUnsafeChars(merchantName)) {
    errors.merchantName = "Merchant name contains invalid characters"
  }

  const cardBrand = input.cardBrand
  if (typeof cardBrand !== "string" || !CARD_BRANDS.includes(cardBrand)) {
    errors.cardBrand = `Card brand must be one of ${CARD_BRANDS.join(", ")}`
  }

  const amount = typeof input.amount === "string" ? input.amount : ""
  const amountCents = parseCents(amount)
  if (amountCents === null) {
    errors.amount = /^\d+(\.\d{1,2})?$/.test(amount)
      ? "Amount can't be more than $1,000,000.00"
      : "Amount must be a number with up to 2 decimal places"
  } else if (amountCents <= 0) {
    errors.amount = "Amount must be greater than zero"
  } else if (amountCents > MAX_AMOUNT_CENTS) {
    errors.amount = "Amount can't be more than $1,000,000.00"
  }

  if (Object.keys(errors).length > 0) return { ok: false, error: errors }

  return {
    ok: true,
    value: { merchantName, cardBrand: cardBrand as CardBrand, amountCents: amountCents as number },
  }
}
