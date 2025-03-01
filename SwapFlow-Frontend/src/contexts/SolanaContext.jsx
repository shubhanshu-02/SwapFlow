"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { useToast } from "../hooks/useToast"

const SolanaContext = createContext(undefined)

export function SolanaProvider({ children }) {
  const [connected, setConnected] = useState(false)
  const [publicKey, setPublicKey] = useState(null)
  const [phantom, setPhantom] = useState(null)
  const { toast } = useToast()

  useEffect(() => {
    // Check if Phantom wallet is available
    const checkPhantom = () => {
      if (window.solana) {
        setPhantom(window.solana)

        // Check if already connected
        if (window.solana.isConnected) {
          setConnected(true)
          setPublicKey(window.solana.publicKey)
        }

        // Listen for connection events
        window.solana.on("connect", () => {
          setConnected(true)
          setPublicKey(window.solana.publicKey)
          toast({
            title: "Wallet connected",
            description: `Connected to ${window.solana.publicKey.toString().slice(0, 4)}...${window.solana.publicKey.toString().slice(-4)}`,
          })
        })

        window.solana.on("disconnect", () => {
          setConnected(false)
          setPublicKey(null)
          toast({
            title: "Wallet disconnected",
            description: "Your wallet has been disconnected",
          })
        })
      }
    }

    checkPhantom()

    return () => {
      // Clean up event listeners
      if (window.solana) {
        window.solana.removeAllListeners("connect")
        window.solana.removeAllListeners("disconnect")
      }
    }
  }, [toast])

  const connect = async () => {
    try {
      if (!phantom) {
        toast({
          title: "Wallet not found",
          description: "Please install Phantom wallet extension",
          variant: "destructive",
        })
        return
      }

      await phantom.connect()
    } catch (error) {
      console.error("Connection error:", error)
      toast({
        title: "Connection failed",
        description: "Failed to connect to wallet",
        variant: "destructive",
      })
    }
  }

  const disconnect = () => {
    if (phantom) {
      phantom.disconnect()
    }
  }

  const signAndSendTransaction = async (transaction) => {
    if (!phantom || !connected) {
      throw new Error("Wallet not connected")
    }

    try {
      const signed = await phantom.signAndSendTransaction(transaction)
      return typeof signed === "object" ? signed.signature : signed
    } catch (error) {
      console.error("Transaction error:", error)
      throw error
    }
  }

  return (
    <SolanaContext.Provider
      value={{
        connected,
        publicKey,
        connect,
        disconnect,
        signAndSendTransaction,
      }}
    >
      {children}
    </SolanaContext.Provider>
  )
}

export function useSolana() {
  const context = useContext(SolanaContext)
  if (context === undefined) {
    throw new Error("useSolana must be used within a SolanaProvider")
  }
  return context
}

