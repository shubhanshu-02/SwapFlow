import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useSolana } from "../contexts/SolanaContext"
import { useAuth } from "../contexts/AuthContext"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { useToast } from "../hooks/useToast"
import { ArrowDown, Loader2, RefreshCw, Wallet } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert"
import { Buffer } from "buffer"
import { VersionedTransaction } from '@solana/web3.js'

function SwapPage() {
  const { connected, publicKey, connect, signAndSendTransaction } = useSolana()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [apiKey, setApiKey] = useState("")
  const [inputMint, setInputMint] = useState("SOL")
  const [outputMint, setOutputMint] = useState("USDC")
  const [amount, setAmount] = useState("")
  const [slippageBps, setSlippageBps] = useState("50")
  const [transactionDetails, setTransactionDetails] = useState(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false)
  const [quoteData, setQuoteData] = useState(null)
  const [isCreatingTx, setIsCreatingTx] = useState(false)
  const [isSendingTx, setIsSendingTx] = useState(false)
  const [swapData, setSwapData] = useState(null)
  const [txSignature, setTxSignature] = useState(null)

  const BASE_URL = "https://swapflow-mdnx.onrender.com"

  // Load API key from user if available
  useEffect(() => {
    if (user && user.apiKeys && user.apiKeys.length > 0) {
      setApiKey(user.apiKeys[0].key)
    }
  }, [user])

  const getQuote = async () => {
    if (!apiKey) {
      toast({
        title: "API Key Required",
        description: "Please enter your API key or login to use your saved keys",
        variant: "destructive",
      })
      return
    }

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
          "X-API-Key": apiKey,
        },
      })

      const data = await response.json()

      if (data.status === "success") {
        setQuoteData(data)
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

  const createSwap = async () => {
    if (!connected) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet first",
        variant: "destructive",
      })
      return
    }

    if (!apiKey) {
      toast({
        title: "API Key Required",
        description: "Please enter your API key",
        variant: "destructive",
      })
      return
    }

    if (!quoteData) {
      toast({
        title: "Quote Required",
        description: "Please get a quote first",
        variant: "destructive",
      })
      return
    }

    setIsCreatingTx(true)
    setSwapData(null)

    try {
      const response = await fetch(`${BASE_URL}/api/v1/swap`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": apiKey,
        },
        body: JSON.stringify({
          inputMint,
          outputMint,
          amount: convertToSmallestUnit(amount, inputMint),
          slippageBps,
          customerPublicKey: publicKey?.toString(),
        }),
      })

      const data = await response.json()

      if (data.status === "success") {
        setSwapData(data)
        setTransactionDetails(data.data);
        toast({
          title: "Transaction Created",
          description: "Swap transaction created successfully",
        })
      } else {
        toast({
          title: "Transaction Creation Failed",
          description: data.message || "Failed to create swap transaction",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Swap creation error:", error)
      toast({
        title: "Transaction Creation Failed",
        description: "An error occurred while creating the swap transaction",
        variant: "destructive",
      })
    } finally {
      setIsCreatingTx(false)
    }
  }

  const sendTransaction = async () => {
    if (!connected) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet first",
        variant: "destructive",
      })
      return
    }

    if (!swapData) {
      toast({
        title: "Transaction Required",
        description: "Please create a transaction first",
        variant: "destructive",
      })
      return
    }

    setIsSendingTx(true)
    setTxSignature(null)

    try {
      // Prepare transaction
      const serializedTransaction = Buffer.from(swapData.data.swapTransaction, "base64")

      // Use the Solana web3.js library to deserialize
      // console.log(serializedTransaction)
      const transaction = VersionedTransaction.deserialize(serializedTransaction)

      // Sign and send transaction
      const signature = await signAndSendTransaction(transaction)
      setTxSignature(signature)
      // Confirm transaction with backend
      const confirmResponse = await fetch(`${BASE_URL}/api/v1/confirm-transaction`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": apiKey,
        },
        body: JSON.stringify({
          initialTxId: swapData.data.initialTxId,
          signature,
        }),
      })

      const confirmData = await confirmResponse.json()

      if (confirmData.status === "success") {
        toast({
          title: "Transaction Confirmed",
          description: "Swap transaction confirmed successfully",
        })
      } else {
        toast({
          title: "Warning",
          description: "Transaction sent but confirmation with backend failed",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Transaction error:", error)
      toast({
        title: "Transaction Failed",
        description: "An error occurred while sending the transaction",
        variant: "destructive",
      })
    } finally {
      setIsSendingTx(false)
    }
  }

  // Utility function to convert amount to smallest unit
  const convertToSmallestUnit = (amount, token) => {
    const decimals = token === "SOL" ? 9 : token === "USDC" ? 6 : 0
    return (Number(amount) * Math.pow(10, decimals)).toString()
  }

  // Utility function to format amounts
  const formatAmount = (amount, token) => {
    const decimals = token === "SOL" ? 9 : token === "USDC" ? 6 : 0
    const value = Number(amount) / Math.pow(10, decimals)
    return value.toLocaleString("en-US", {
      minimumFractionDigits: decimals > 2 ? 2 : decimals,
      maximumFractionDigits: decimals > 4 ? 4 : decimals,
    })
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Swap Tokens</h1>

      <Card>
        <CardHeader>
          <CardTitle>Swap Configuration</CardTitle>
          <CardDescription>Configure your token swap parameters</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!connected && (
            <Button variant="outline" className="w-full" onClick={connect}>
              <Wallet className="mr-2 h-4 w-4" />
              Connect Wallet
            </Button>
          )}

          {connected && publicKey && (
            <div className="bg-muted p-3 rounded-md text-sm">
              <div className="font-medium">Connected Wallet</div>
              <div className="font-mono text-xs">
                {publicKey.toString().slice(0, 10)}...{publicKey.toString().slice(-10)}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="apiKey"> API KEY (This key should not be shared)</Label>
            <Input id="apiKey" placeholder="Your API Key" value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
            {!user && (
              <div className="text-xs text-muted-foreground">
                <Button variant="link" className="h-auto p-0 text-xs" onClick={() => navigate("/auth/login")}>
                  Login
                </Button>{" "}
                to use your saved API keys
              </div>
            )}
          </div>

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

          <div className="flex justify-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                const temp = inputMint
                setInputMint(outputMint)
                setOutputMint(temp)
              }}
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
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
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button className="w-full" onClick={getQuote} disabled={isLoadingQuote}>
            {isLoadingQuote ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Getting Quote...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Get Quote
              </>
            )}
          </Button>
        </CardFooter>
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
                  {formatAmount(quoteData.data.outputValue, outputMint)} {outputMint}
                </div>
              </div>
            </div>

            <div>
              <div className="text-sm text-muted-foreground">Price Impact</div>
              <div className="font-medium">{(quoteData.data.feeAmount / 100000).toFixed(3)}</div>
            </div>

            {quoteData.data.routePlan && (
              <div>
                <div className="text-sm text-muted-foreground">Route</div>
                <div className="font-medium">
                  {quoteData.data.routePlan.map((route) => route.swapInfo.label).join(" → ")}
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={createSwap} disabled={isCreatingTx || !connected}>
              {isCreatingTx ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Transaction...
                </>
              ) : (
                "Create Transaction"
              )}
            </Button>
          </CardFooter>
        </Card>
      )}

{swapData && (
  <Card>
    <CardHeader>
      <CardTitle>Transaction Details</CardTitle>
    </CardHeader>
    <CardContent>
      <Alert className="mb-4">
        <AlertTitle className = "text-green-400">Transaction Ready</AlertTitle>
        <AlertDescription>Your swap transaction has been created and is ready to be sent.</AlertDescription>
      </Alert>
      <div className="space-y-2">
        <p><strong>Customer Wallet:</strong> {transactionDetails.customerWallet}</p>
        <p><strong>Merchant Wallet:</strong> {transactionDetails.merchantWallet}</p>
        <p><strong>Input Amount:</strong> {formatAmount(transactionDetails.inputAmount, transactionDetails.inputMint)} {transactionDetails.inputMint}</p>
        <p><strong>Output Amount:</strong> {formatAmount(transactionDetails.outputAmount, transactionDetails.outputMint)} {transactionDetails.outputMint}</p>
        <p><strong>Slippage:</strong> {transactionDetails.slippageBps / 100}%</p>
        <p><strong>Route:</strong> {transactionDetails.route}</p>
        <p><strong>Fee:</strong> {formatAmount(transactionDetails.fee, transactionDetails.feeMint)} {transactionDetails.feeMint}</p>
        <p><strong>Price Impact:</strong> {transactionDetails.priceImpact}%</p>
        <p><strong>Expected Output:</strong> {formatAmount(transactionDetails.expectedOutput, transactionDetails.outputMint)} {transactionDetails.outputMint}</p>
        <p><strong>Last Valid Block Height:</strong> {transactionDetails.lastValidBlockHeight}</p>
        <p><strong>Compute Unit Limit:</strong> {transactionDetails.computeUnitLimit}</p>
      </div>
    </CardContent>
    <CardFooter>
      <Button className="w-full" onClick={sendTransaction} disabled={isSendingTx}>
        {isSendingTx ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sending Transaction...
          </>
        ) : (
          "Send Transaction"
        )}
      </Button>
    </CardFooter>
  </Card>
)}
{/* 
    {swapData && (
        <Card>
          <CardHeader>
            <CardTitle>Transaction</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertTitle>Transaction Ready</AlertTitle>
              <AlertDescription>Your swap transaction has been created and is ready to be sent.</AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={sendTransaction} disabled={isSendingTx}>
              {isSendingTx ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending Transaction...
                </>
              ) : (
                "Send Transaction"
              )}
            </Button>
          </CardFooter>
        </Card>
      )} 
      
{transactionDetails && (
        <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
          <h2 className="text-xl font-bold mb-4">Transaction Details</h2>
          <div className="space-y-2">
            <p><strong>Customer Wallet:</strong> {transactionDetails.customerWallet}</p>
            <p><strong>Merchant Wallet:</strong> {transactionDetails.merchantWallet}</p>
            <p><strong>Input Amount:</strong> {formatAmount(transactionDetails.inputAmount, transactionDetails.inputMint)} {transactionDetails.inputMint}</p>
            <p><strong>Output Amount:</strong> {formatAmount(transactionDetails.outputAmount, transactionDetails.outputMint)} {transactionDetails.outputMint}</p>
            <p><strong>Slippage:</strong> {transactionDetails.slippageBps / 100}%</p>
            <p><strong>Route:</strong> {transactionDetails.route}</p>
            <p><strong>Fee:</strong> {formatAmount(transactionDetails.fee, transactionDetails.feeMint)} {transactionDetails.feeMint}</p>
            <p><strong>Price Impact:</strong> {transactionDetails.priceImpact}%</p>
            <p><strong>Expected Output:</strong> {formatAmount(transactionDetails.expectedOutput, transactionDetails.outputMint)} {transactionDetails.outputMint}</p>
            <p><strong>Last Valid Block Height:</strong> {transactionDetails.lastValidBlockHeight}</p>
            <p><strong>Compute Unit Limit:</strong> {transactionDetails.computeUnitLimit}</p>
          </div>
          <button
            className="mt-4 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            type="button"
            onClick={sendTransaction}
            disabled={isSendingTx}
          >
            {isSendingTx ? 'Sending Transaction...' : 'Send Transaction'}
          </button>
        </div>
      )} */}


      {txSignature && (
        <Card>
          <CardHeader>
            <CardTitle>Transaction Sent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Transaction Signature</div>
              <div className="font-mono text-xs break-all bg-muted p-3 rounded-md">{txSignature}</div>
              <div className="pt-2">
                <a
                  href={`https://solscan.io/tx/${txSignature}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline text-sm"
                >
                  View on Solscan
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default SwapPage

