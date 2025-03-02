import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { useToast } from "../hooks/useToast"
import { Loader2, Key, WalletIcon, RefreshCw, ClockIcon } from "lucide-react" 

function AdminPage() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [apiKeys, setApiKeys] = useState([])
  const [wallets, setWallets] = useState([])
  const [transactions, setTransactions] = useState([])
  const [isLoadingKeys, setIsLoadingKeys] = useState(false)
  const [isLoadingWallets, setIsLoadingWallets] = useState(false)
  const [isGeneratingKey, setIsGeneratingKey] = useState(false)
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false)
  const [tokenName, setTokenName] = useState("")
  const [walletAddress, setWalletAddress] = useState("")
  const [isAddingWallet, setIsAddingWallet] = useState(false)
  const [apiKey, setApiKey] = useState("")

  const BASE_URL = import.meta.env.VITE_BASE_URL

  useEffect(() => {
    // Redirect if not logged in
    if (!loading && !user) {
      navigate("/auth/login")
    } else if (user) {
      loadApiKeys()
      loadWallets()
    }
  }, [user, loading, navigate])

  // Add new useEffect to handle apiKey changes
  useEffect(() => {
    if (apiKey) {
      loadTransactions()
    }
  }, [apiKey])

  const loadApiKeys = async () => {
    setIsLoadingKeys(true)
    try {
      const response = await fetch(`${BASE_URL}/auth/v1/profile`, {
        credentials: "include",
      })
      const data = await response.json()

      if (data.status === "success") {
        setApiKeys(data.data.user.apiKeys || [])
      }
    } catch (error) {
      console.error("Failed to load API keys:", error)
      toast({
        title: "Error",
        description: "Failed to load API keys",
        variant: "destructive",
      })
    } finally {
      setIsLoadingKeys(false)
    }
  }

  const loadWallets = async () => {
    setIsLoadingWallets(true)
    try {
      const response = await fetch(`${BASE_URL}/auth/v1/wallets`, {
        credentials: "include",
      })
      const data = await response.json()

      if (data.status === "success") {
        setWallets(data.data.wallets || [])
      }
    } catch (error) {
      console.error("Failed to load wallets:", error)
      toast({
        title: "Error",
        description: "Failed to load wallets",
        variant: "destructive",
      })
    } finally {
      setIsLoadingWallets(false)
    }
  }

  const generateApiKey = async () => {
    setIsGeneratingKey(true)
    try {
      const response = await fetch(`${BASE_URL}/auth/v1/generate-api-key`, {
        method: "POST",
        credentials: "include",
      })
      const data = await response.json()

      if (data.status === "success") {
        toast({
          title: "Success",
          description: "API key generated successfully",
        })
        loadApiKeys()
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to generate API key",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to generate API key:", error)
      toast({
        title: "Error",
        description: "Failed to generate API key",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingKey(false)
    }
  }

  const addWallet = async (e) => {
    e.preventDefault()
    setIsAddingWallet(true)

    try {
      const response = await fetch(`${BASE_URL}/auth/v1/wallet`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          tokenName,
          address: walletAddress,
        }),
      })

      const data = await response.json()

      if (data.status === "success") {
        toast({
          title: "Success",
          description: "Wallet updated successfully",
        })
        loadWallets()
        setTokenName("")
        setWalletAddress("")
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to update wallet",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to update wallet:", error)
      toast({
        title: "Error",
        description: "Failed to update wallet",
        variant: "destructive",
      })
    } finally {
      setIsAddingWallet(false)
    }
  }

  const loadTransactions = async () => {
    setIsLoadingTransactions(true)
    try {
      if (!apiKey) {
        throw new Error("No API key available")
      }
      
      const response = await fetch(`${BASE_URL}/api/v1/transactions`, {
        headers: {
          "x-api-key": apiKey,
        },
        credentials: "include",
      })
      const data = await response.json()

      if (data.status === "success") {
        // Update to match the API response structure
        const formattedTransactions = data.data.transactions.map(tx => ({
          id: tx.id,
          inputMint: tx.inputMint,
          outputMint: tx.outputMint,
          inputAmount: tx.amount, // Changed from outputAmount to match API
          status: tx.status,
          createdAt: tx.requestedAt // Changed from createdAt to match API
        }))
        setTransactions(formattedTransactions)
      }
    } catch (error) {
      console.error("Failed to load transactions:", error)
      toast({
        title: "Error",
        description: "Failed to load transactions",
        variant: "destructive",
      })
    } finally {
      setIsLoadingTransactions(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 px-10">
      <h1 className="text-3xl font-bold">Admin Panel</h1>

      <Tabs defaultValue="api-keys">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="api-keys">API Keys</TabsTrigger>
          <TabsTrigger value="wallets">Wallet Management</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="api-keys" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>API Keys</CardTitle>
              <CardDescription>Manage your API keys for accessing the SwapFlow API</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={generateApiKey} disabled={isGeneratingKey}>
                {isGeneratingKey ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Key className="mr-2 h-4 w-4" />
                    Generate New API Key
                  </>
                )}
              </Button>

              {isLoadingKeys ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : apiKeys.length > 0 ? (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Your API Keys:</h3>
                  {apiKeys.map((key, index) => (
                    <div 
                      key={index} 
                      className={`bg-muted p-3 rounded-md text-md flex items-center cursor-pointer hover:bg-muted/80 ${
                        apiKey === key.key ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => setApiKey(key.key)}
                    >
                      <Key className="h-4 w-4 mr-2 text-muted-foreground" />
                      <div>
                        <div className="font-mono">{key.key}</div>
                        <div className="text-sm text-gray-400">
                          Created: {new Date(key.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  No API keys found. Generate one to get started.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="wallets" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Wallet Management</CardTitle>
              <CardDescription>Manage your wallet addresses for different tokens</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={addWallet} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="tokenName">Token Name</Label>
                    <Input
                      id="tokenName"
                      placeholder="e.g., SOL, USDC"
                      value={tokenName}
                      onChange={(e) => setTokenName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="walletAddress">Wallet Address</Label>
                    <Input
                      id="walletAddress"
                      placeholder="Enter wallet address"
                      value={walletAddress}
                      onChange={(e) => setWalletAddress(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <Button type="submit" disabled={isAddingWallet}>
                  {isAddingWallet ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <WalletIcon className="mr-2 h-4 w-4" />
                      Add/Update Wallet
                    </>
                  )}
                </Button>
              </form>

              {isLoadingWallets ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : wallets.length > 0 ? (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Your Wallets:</h3>
                  {wallets.map((wallet, index) => (
                    <div key={index} className="bg-muted p-3 rounded-md text-md flex items-center">
                      <WalletIcon className="h-6 w-6 mr-2 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{wallet.tokenName}</div>
                        <div className="font-mono text-sm">{wallet.address}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">No wallets found. Add one to get started.</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Initialized Transactions</CardTitle>
              <CardDescription>View all initialized swap transactions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {apiKeys.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="apiKeySelect">Select API Key</Label>
                  <select
                    id="apiKeySelect"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full p-2 border rounded-md bg-background"
                  >
                    <option value="">Select an API key...</option>
                    {apiKeys.map((key, index) => (
                      <option key={index} value={key.key}>
                        {key.key.substring(0, 20)}... ({new Date(key.createdAt).toLocaleDateString()})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-2">
                <Button 
                  onClick={loadTransactions} 
                  disabled={!apiKey || isLoadingTransactions}
                  className="w-full sm:w-auto"
                >
                  {isLoadingTransactions ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Load Transactions
                    </>
                  )}
                </Button>
                {!apiKey && (
                  <p className="text-sm text-muted-foreground">
                    Select an API key to load transactions
                  </p>
                )}
              </div>

              {isLoadingTransactions ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : transactions.length > 0 ? (
                <div className="space-y-4">
                  {transactions.map((tx, index) => (
                    <div key={index} className="bg-muted p-4 rounded-md">
                      <div className="flex items-center space-x-2 mb-2">
                        <ClockIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{new Date(tx.createdAt).toLocaleString()}</span>
                      </div>
                      <p>
                        <strong>Transaction ID:</strong> {tx.id}
                      </p>
                      <p>
                        <strong>Input:</strong> {tx.inputAmount} {tx.inputMint}
                      </p>
                      <p>
                        <strong>Output:</strong> {tx.outputAmount} {tx.outputMint}
                      </p>
                      <p>
                        <strong>Status:</strong> {tx.status}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  {apiKey ? "No transactions found." : "Select an API key to view transactions"}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default AdminPage