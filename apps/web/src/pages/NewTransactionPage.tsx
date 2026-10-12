import { useEffect, useRef, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { Alert, Button, Card, Form, Input, InputNumber, Select, message } from "antd"

import { BackLink, useGoBack } from "../components/BackLink"
import { CardBrand } from "../models/transaction"
import { ValidationError, createTransaction } from "../services/transaction-service"
import type { NewTransactionInput } from "../services/transaction-service"
import { transactionPath } from "../utils/routes"

const MAX_AMOUNT = 1_000_000
const CARD_BRAND_OPTIONS = Object.values(CardBrand).map((brand) => ({ value: brand, label: brand }))
const MAX_MERCHANT_LENGTH = 100
const FIELD_NAMES: (keyof NewTransactionInput)[] = ["merchantName", "cardBrand", "amount"]

const isFieldName = (name: string): name is keyof NewTransactionInput =>
  (FIELD_NAMES as string[]).includes(name)

const validateMerchantLength = (_: unknown, value?: string) =>
  [...(value ?? "").trim()].length > MAX_MERCHANT_LENGTH
    ? Promise.reject(new Error(`Merchant name must be ${MAX_MERCHANT_LENGTH} characters or fewer`))
    : Promise.resolve()

const validateAmount = (_: unknown, value?: string) => {
  if (!value) return Promise.resolve()
  if (value.startsWith("-")) return Promise.reject(new Error("Amount must be greater than zero"))
  if (!/^\d+(\.\d{1,2})?$/.test(value)) return Promise.reject(new Error("Use up to 2 decimal places"))
  if (Number(value) <= 0) return Promise.reject(new Error("Amount must be greater than zero"))
  if (Number(value) > MAX_AMOUNT) return Promise.reject(new Error("Amount can't be more than $1,000,000.00"))
  return Promise.resolve()
}

export const NewTransactionPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { goBack } = useGoBack()
  const [form] = Form.useForm<NewTransactionInput>()
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  // A ref updates immediately, so a second submit before the re-render is ignored
  const inFlight = useRef(false)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  const handleFinish = async (values: NewTransactionInput) => {
    if (inFlight.current) return
    inFlight.current = true
    setSubmitting(true)
    setSubmitError(null)

    try {
      const transaction = await createTransaction(values)
      message.success(`Transaction ${transaction.id} created`)
      if (!mounted.current) return
      navigate(transactionPath(transaction.id), { replace: true, state: location.state })
    } catch (error) {
      if (!mounted.current) return
      const fieldErrors = error instanceof ValidationError ? Object.entries(error.fields) : []
      const knownErrors = fieldErrors.flatMap(([name, msg]) =>
        isFieldName(name) && typeof msg === "string" ? [{ name, errors: [msg] }] : []
      )
      if (knownErrors.length > 0) {
        form.setFields(knownErrors)
      } else if (error instanceof ValidationError) {
        setSubmitError("Please check the details and try again.")
      } else {
        setSubmitError("We couldn't create the transaction. Please try again.")
      }
      inFlight.current = false
      setSubmitting(false)
    }
  }

  return (
    <div className="new-transaction">
      <BackLink>Back</BackLink>
      <Card>
        <h1 className="card-title">New transaction</h1>
        <p className="card-subtitle">Record a card payment. The card surcharge is calculated for you.</p>

        {submitError && <Alert className="page-alert" type="error" showIcon message={submitError} />}

        <Form
          form={form}
          layout="vertical"
          requiredMark="optional"
          initialValues={{ cardBrand: CardBrand.VISA }}
          onFinish={handleFinish}
          disabled={submitting}
        >
          <Form.Item
            label="Merchant name"
            name="merchantName"
            rules={[
              { required: true, whitespace: true, message: "Enter the merchant name" },
              { validator: validateMerchantLength },
            ]}
          >
            <Input autoComplete="off" />
          </Form.Item>

          <Form.Item label="Card brand" name="cardBrand" rules={[{ required: true, message: "Choose a card brand" }]}>
            <Select options={CARD_BRAND_OPTIONS} />
          </Form.Item>

          <Form.Item
            label="Amount"
            name="amount"
            extra="Before surcharge. The total charged is shown once it's created."
            rules={[{ required: true, message: "Enter an amount" }, { validator: validateAmount }]}
          >
            {/* No min/max: InputNumber would silently clamp the amount */}
            <InputNumber<string> stringMode prefix="$" style={{ width: "100%" }} />
          </Form.Item>

          <div className="form-actions">
            <Button onClick={() => goBack()}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={submitting}>
              Create transaction
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  )
}
