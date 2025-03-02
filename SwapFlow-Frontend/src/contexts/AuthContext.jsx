"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { useToast } from "../hooks/useToast"

const AuthContext = createContext(undefined)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  //meta vite env
 const BASE_URL = import.meta.env.VITE_BASE_URL;



  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      try {
        const response = await fetch(`${BASE_URL}/auth/v1/profile`, {
          credentials: "include",
        })

        if (response.ok) {
          const data = await response.json()
          if (data.status === "success") {
            setUser(data.data.user)
          }
        }
      } catch (error) {
        console.error("Auth check failed:", error)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [BASE_URL])

  const login = async (email, password) => {
    try {
      const U  = import.meta.env.VITE_BASE_URL;
      const response = await fetch(`${U}/auth/v1/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log("Login API Response:", data); // Log the response

      if (data.status === 'success') {
        // Update user with the API key from the response
        setUser({
          ...data.data.user,
          apiKey: data.data.apiKey // Include the API key in the user object
        });
        toast({
          title: "Login successful",
          description: "Welcome back!",
        })
        return true;
      } else {
        console.error("Login failed:", data.message);
        toast({
          title: "Login failed",
          description: data.message || "Please check your credentials",
          variant: "destructive",
        })
        return false;
      }
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Login failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
      return false;
    }
  }

  const signup = async (email, password) => {
    try {
      setLoading(true)
      const response = await fetch(`${BASE_URL}/auth/v1/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (data.status === "success") {
        toast({
          title: "Signup successful",
          description: "Please login with your new account",
        })
        return true
      } else {
        toast({
          title: "Signup failed",
          description: data.message || "Please try again",
          variant: "destructive",
        })
        return false
      }
    } catch (error) {
      console.error("Signup error:", error)
      toast({
        title: "Signup failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
      return false
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    // You might want to call a logout endpoint here if your backend requires it
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    })
  }

  return <AuthContext.Provider value={{ user, login, signup, logout, loading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

