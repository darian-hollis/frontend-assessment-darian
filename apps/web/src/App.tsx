import { Button } from "antd"
import { Link, Route, Routes, useLocation, useMatch, useNavigate } from "react-router-dom"

import { NewTransactionPage } from "./pages/NewTransactionPage"
import { TransactionDetailPage } from "./pages/TransactionDetailPage"
import { TransactionsPage } from "./pages/TransactionsPage"

const App = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const onNewTransactionPage = useMatch("/transactions/new") !== null

  return (
    <div className="app">
      <nav className="app-nav">
        <Link to="/" className="brand">
          Payment Portal
        </Link>
        {!onNewTransactionPage && (
          <Button
            type="primary"
            onClick={() => navigate("/transactions/new", { state: { from: location.pathname + location.search } })}
          >
            New transaction
          </Button>
        )}
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
