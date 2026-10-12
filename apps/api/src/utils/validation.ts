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
