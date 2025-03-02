import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { useToast } from "../hooks/useToast"
import { Loader2 } from "lucide-react"

function QuotePage() {
  const [inputMint, setInputMint] = useState("SOL")
  const [outputMint, setOutputMint] = useState("USDC")
  const [amount, setAmount] = useState("")
  const [slippageBps, setSlippageBps] = useState("50")
  const [isLoadingQuote, setIsLoadingQuote] = useState(false)
  const [quoteData, setQuoteData] = useState(null)
  const { toast } = useToast()

  const BASE_URL = "https://swapflow-mdnx.onrender.com"

  const getQuote = async () => {
    if (!amount || isNaN(Number(amount))) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      })
      return
    }

    setIsLoadingQuote(true)
    setQuoteData(null)

    try {
      const params = new URLSearchParams({
        inputMint,
        outputMint,
        amount: convertToSmallestUnit(amount, inputMint),
        slippageBps,
      })

      const response = await fetch(`${BASE_URL}/api/v1/quote?${params.toString()}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      })

      const data = await response.json()
      
      if (data.status === "success") {
        // console.log(data);
        setQuoteData(data.data)
        toast({
          title: "Quote Received",
          description: "Swap quote fetched successfully",
        })
      } else {
        toast({
          title: "Quote Failed",
          description: data.message || "Failed to get quote",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Quote error:", error)
      toast({
        title: "Quote Failed",
        description: "An error occurred while fetching the quote",
        variant: "destructive",
      })
    } finally {
      setIsLoadingQuote(false)
    }
  }

  const convertToSmallestUnit = (amount, token) => {
    const decimals = token === "SOL" ? 9 : token === "USDC" ? 6 : 0
    return (Number(amount) * Math.pow(10, decimals)).toString()
  }

  const formatAmount = (amount, token) => {
    const decimals = token === "SOL" ? 9 : token === "USDC" ? 6 : 0
    const value = Number(amount) / Math.pow(10, decimals)
    return value.toLocaleString("en-US", {
      minimumFractionDigits: decimals > 2 ? 2 : decimals,
      maximumFractionDigits: decimals > 4 ? 4 : decimals,
    })
  }

  return (
    <div className="max-w-xl mx-auto space-y-6 p-4">
      <h1 className="text-3xl font-bold">Get Payment Quote</h1>

      <Card>
        <CardHeader>
          <CardTitle>Current Best Price</CardTitle>
          <CardDescription>Enter amount to get a quote</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>From</Label>
              <Select value={inputMint} onValueChange={setInputMint}>
                <SelectTrigger>
                  <SelectValue placeholder="Select token" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SOL">SOL</SelectItem>
                  <SelectItem value="USDC">USDC</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Amount</Label>
              <Input type="text" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>To</Label>
              <Select value={outputMint} onValueChange={setOutputMint}>
                <SelectTrigger>
                  <SelectValue placeholder="Select token" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SOL">SOL</SelectItem>
                  <SelectItem value="USDC">USDC</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Slippage (%)</Label>
              <Input
                type="text"
                placeholder="Slippage (in bps)"
                value={slippageBps}
                onChange={(e) => setSlippageBps(e.target.value)}
              />
            </div>
          </div>

          <Button className="w-full" onClick={getQuote} disabled={isLoadingQuote}>
            {isLoadingQuote ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Getting Quote...
              </>
            ) : (
              "Get Quote"
            )}
          </Button>
        </CardContent>
      </Card>

      {quoteData && (
        <Card>
          <CardHeader>
            <CardTitle>Quote Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Input Amount</div>
                <div className="font-medium">
                  {amount} {inputMint}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Output Amount</div>
                <div className="font-medium">
                    
                  {formatAmount(quoteData.outputValue, outputMint)} {outputMint}
                </div>
              </div>
            </div>

            <div>
              <div className="text-sm text-muted-foreground">Price Impact</div>
              <div className="font-medium">{(quoteData.feeAmount / 100000).toFixed(3)}%</div>
            </div>

            {quoteData.routePlan && (
              <div>
                <div className="text-sm text-muted-foreground">Route</div>
                <div className="font-medium">
                  {quoteData.routePlan.map((route) => route.swapInfo.label).join(" → ")}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default QuotePage

