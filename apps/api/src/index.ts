import express from "express"
import type { NextFunction, Request, Response } from "express"
import cors from "cors"

import { CORS_ORIGIN, PORT } from "./config.js"
import { createTransactionService } from "./services/transaction-service.js"
import { parseListQuery, parseNewTransaction } from "./utils/validation.js"

const app = express()

app.disable("x-powered-by")
app.use(cors({ origin: CORS_ORIGIN }))
app.use(express.json({ limit: "10kb" }))

const transactionService = createTransactionService()

app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" })
})

app.get("/api/transactions", (req: Request, res: Response) => {
  const query = parseListQuery(req.query)
  if (!query.ok) {
    return res.status(400).json({ error: query.error })
  }
  res.json(transactionService.list(query.value))
})

app.post("/api/transactions", (req: Request, res: Response) => {
  const input = parseNewTransaction(req.body)
  if (!input.ok) {
    return res.status(400).json({ error: "Invalid transaction", fields: input.error })
  }
  res.status(201).json(transactionService.create(input.value))
})

app.get("/api/transactions/:id", (req: Request, res: Response) => {
  const transaction = transactionService.getById(req.params.id)
  if (!transaction) {
    return res.status(404).json({ error: "Transaction not found" })
  }
  res.json(transaction)
})

app.use((err: Error & { status?: number }, _req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) return next(err)
  if (err.status && err.status >= 400 && err.status < 500) {
    return res.status(err.status).json({ error: "Bad request" })
  }
  console.error(err)
  res.status(500).json({ error: "Something went wrong" })
})

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT} (${transactionService.count()} transactions)`)
})
