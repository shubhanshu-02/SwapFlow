import { Outlet } from "react-router-dom"
import Header from "./Header"

function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto py-6 px-4">
        <Outlet />
      </main>
      <footer className="py-6 border-t">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} SwapFlow. All rights reserved.
        </div>
      </footer>
    </div>
  )
}

export default Layout

