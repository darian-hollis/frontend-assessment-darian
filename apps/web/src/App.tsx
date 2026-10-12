import { Button } from "antd"
import { Link, Route, Routes, useNavigate } from "react-router-dom"

import { NewTransactionPage } from "./pages/NewTransactionPage"
import { TransactionDetailPage } from "./pages/TransactionDetailPage"
import { TransactionsPage } from "./pages/TransactionsPage"

const App = () => {
  const navigate = useNavigate()

  return (
    <div className="app">
      <nav className="app-nav">
        <Link to="/" className="brand">
          Payment Portal
        </Link>
        <Button type="primary" onClick={() => navigate("/transactions/new")}>
          New transaction
        </Button>
      </nav>

      <Routes>
        <Route path="/" element={<TransactionsPage />} />
        <Route path="/transactions/new" element={<NewTransactionPage />} />
        <Route path="/transactions/:id" element={<TransactionDetailPage />} />
      </Routes>
    </div>
  )
}

export default App
