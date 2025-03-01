import { Link } from "react-router-dom"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { ArrowRight } from "lucide-react"

function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center space-y-8 py-12">
      <div className="text-center space-y-4 max-w-3xl my-4">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Welcome to SwapFlow</h1>
        <p className="text-xl text-muted-foreground">The easiest way to swap tokens on Solana</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl pb-8">
        <Card>
          <CardHeader>
            <CardTitle>Swap Tokens</CardTitle>
            <CardDescription>Swap your Solana tokens with the best rates</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/swap">
              <Button className="w-full">
                Go to Swap <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Admin Panel</CardTitle>
            <CardDescription>Manage your API keys and wallet addresses</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/admin">
              <Button className="w-full" variant="outline">
                Go to Admin <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        
      </div>

      <div className="px-6">

       <section className="py-12 md:py-16 bg-slate-100 rounded-lg px-6">
        <div className="container px-4">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Low Fees</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Enjoy minimal transaction fees when swapping tokens on the Solana blockchain.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Best Rates</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We aggregate liquidity from multiple DEXs to ensure you get the best possible rates.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Fast Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Solana's high-performance blockchain ensures your swaps are processed in seconds.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      </div>

      <section className="py-12 md:py-16">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col md:flex-row gap-8 items-center">
          {/* Text Content */}
          <div className="md:w-1/2 space-y-4">
            <h2 className="text-3xl font-bold tracking-tighter">
              Integrate SwapFlow into your application
            </h2>
            <p className="text-muted-foreground">
              Our API makes it easy to add token swapping functionality to your dApp or website.
            </p>
            <Link
              to="/admin"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
            >
              Get API Keys <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>

          {/* Code Example */}
          
          <div className="md:w-1/2 bg-muted p-6 border-4 border-slate-300 rounded-lg">
            <pre className="text-xs md:text-sm overflow-x-auto">
              <code>{`// Example API request
const response = await fetch('https://api.swapflow.com/v1/quote', {
  method: 'GET',
  headers: {
    'X-API-Key': 'your-api-key',
    'Content-Type': 'application/json'
  }
});

const data = await response.json();`}</code>
            </pre>
          </div>
        </div>
      </div>
    </section>

    </div>
    
  )
}

export default HomePage

