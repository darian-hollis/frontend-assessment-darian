import express from "express"
import type { NextFunction, Request, Response } from "express"
import cors from "cors"

import { PORT } from "./config.js"
import { createTransactionService } from "./services/transaction-service.js"
import { parseListQuery } from "./utils/validation.js"

const app = express()

app.use(cors({ origin: "*", credentials: true }))
app.use(express.json())

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
  const { merchantName, cardBrand, amount } = req.body
  const transaction = transactionService.create({ merchantName, cardBrand, amount })
  res.status(201).json(transaction)
})

app.get("/api/transactions/:id", (req: Request, res: Response) => {
  const transaction = transactionService.getById(req.params.id)
  if (!transaction) {
    return res.status(404).json({ error: "Transaction not found" })
  }
  res.json(transaction)
})

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err)
  res.status(500).json({ error: err.message, stack: err.stack })
})

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT} (${transactionService.count()} transactions)`)
})
