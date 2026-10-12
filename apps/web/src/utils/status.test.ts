import { describe, expect, it } from "vitest"

import { TransactionStatus } from "../models/transaction"
import { statusTagColor } from "./status"

describe("statusTagColor", () => {
  it("maps known statuses to tag colors", () => {
    expect(statusTagColor(TransactionStatus.APPROVED)).toBe("success")
    expect(statusTagColor(TransactionStatus.DECLINED)).toBe("error")
    expect(statusTagColor(TransactionStatus.PENDING)).toBe("warning")
    expect(statusTagColor(TransactionStatus.REFUNDED)).toBe("default")
  })

  it("falls back to default for statuses the UI doesn't know about", () => {
    expect(statusTagColor("CHARGEBACK" as TransactionStatus)).toBe("default")
  })
})
