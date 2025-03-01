import { Link, useLocation } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { useSolana } from "../contexts/SolanaContext"
import { Button } from "./ui/button"
import { ModeToggle } from "./ModeToggle"
import { Wallet } from "lucide-react"

function Header() {
  const location = useLocation()
  const { user, logout } = useAuth()
  const { connected, publicKey, connect } = useSolana()

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <Link to="/" className="font-bold text-xl">
            SwapFlow
          </Link>
          <nav className="hidden md:flex items-center space-x-6">
            <Link
              to="/swap"
              className={`text-sm ${location.pathname === "/swap" ? "font-medium" : "text-muted-foreground"}`}
            >
              Swap
            </Link>
            <Link
              to="/quote"
              className={`text-sm ${location.pathname === "/swap" ? "font-medium" : "text-muted-foreground"}`}
            >
              Get Quote
            </Link>
            {user && (
              <Link
                to="/admin"
                className={`text-sm ${location.pathname.startsWith("/admin") ? "font-medium" : "text-muted-foreground"}`}
              >
                Admin
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center space-x-4">
          {!connected ? (
            <Button variant="outline" size="sm" onClick={connect} className="hidden sm:flex">
              <Wallet className="mr-2 h-4 w-4" />
              Connect Wallet
            </Button>
          ) : (
            <Button variant="outline" size="sm" className="hidden sm:flex">
              <Wallet className="mr-2 h-4 w-4" />
              {publicKey?.toString().slice(0, 4)}...{publicKey?.toString().slice(-4)}
            </Button>
          )}

          {!user ? (
            <Link to="/auth/login">
              <Button size="sm">Login</Button>
            </Link>
          ) : (
            <Button size="sm" variant="ghost" onClick={logout}>
              Logout
            </Button>
          )}

          {/* <ModeToggle /> */}
        </div>
      </div>
    </header>
  )
}

export default Header

