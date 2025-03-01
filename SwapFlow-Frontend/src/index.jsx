import React from "react"
import ReactDOM from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import App from "./App"
import "./index.css"
import { AuthProvider } from "./contexts/AuthContext"
import { SolanaProvider } from "./contexts/SolanaContext"
import { ThemeProvider } from "./contexts/ThemeContext"
import { Toaster } from "./components/ui/toaster"

const root = ReactDOM.createRoot(document.getElementById("root"))
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider defaultTheme="light">
        <AuthProvider>
          <SolanaProvider>
            <App />
            <Toaster />
          </SolanaProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
)

