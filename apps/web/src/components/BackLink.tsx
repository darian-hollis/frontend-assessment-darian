import type { MouseEvent, ReactNode } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { ArrowLeftOutlined } from "@ant-design/icons"

interface LocationState {
  from?: string
}

export const useGoBack = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const from = (location.state as LocationState | null)?.from

  const goBack = (event?: MouseEvent) => {
    if (event && (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)) return
    event?.preventDefault()
    if (from) navigate(-1)
    else navigate("/")
  }

  return { href: from ?? "/", goBack }
}

export const BackLink = ({ children }: { children: ReactNode }) => {
  const { href, goBack } = useGoBack()

  return (
    <Link className="back-link" to={href} onClick={goBack}>
      <ArrowLeftOutlined aria-hidden /> {children}
    </Link>
  )
}
