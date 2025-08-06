"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { supabase } from "@/lib/supabase"
import type { User as SupabaseUser, Session } from "@supabase/supabase-js"

interface User {
  id: string
  email: string
  username: string
  full_name?: string
  avatar_url?: string
  bio?: string
}

interface AuthContextType {
  user: User | null
  session: Session | null
  isAuthenticated: boolean
  loading: boolean
  getAccessToken: () => string | null
  signUp: (email: string, password: string, username: string, fullName?: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      setSession(session)
      if (session?.user) {
        await fetchUserProfile(session.user)
      }
      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      if (session?.user) {
        await fetchUserProfile(session.user)
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserProfile = async (supabaseUser: SupabaseUser) => {
    try {
      console.log("Fetching user profile for:", supabaseUser.id)
      
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", supabaseUser.id)
        .single()

      if (error) {
        console.error("Error fetching profile:", error)
        
        // If profile doesn't exist, create a basic user object
        if (error.code === 'PGRST116') {
          console.log("Profile not found, creating basic user object")
          setUser({
            id: supabaseUser.id,
            email: supabaseUser.email!,
            username: supabaseUser.email!.split('@')[0],
            full_name: '',
            avatar_url: '',
            bio: '',
          })
        }
        return
      }

      console.log("Profile fetched successfully:", profile)
      
      setUser({
        id: supabaseUser.id,
        email: supabaseUser.email!,
        username: profile.username,
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
        bio: profile.bio,
      })
    } catch (error) {
      console.error("Error in fetchUserProfile:", error)
      
      // Fallback: create basic user object from auth data
      setUser({
        id: supabaseUser.id,
        email: supabaseUser.email!,
        username: supabaseUser.email!.split('@')[0],
        full_name: '',
        avatar_url: '',
        bio: '',
      })
    }
  }

  const getAccessToken = () => {
    return session?.access_token || null
  }

  const signUp = async (email: string, password: string, username: string, fullName?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          full_name: fullName || "",
        },
      },
    })

    if (error) {
      throw new Error(error.message)
    }

    // Profile will be created automatically via the trigger
  }

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      throw new Error(error.message)
    }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      throw new Error(error.message)
    }
    setUser(null)
    setSession(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isAuthenticated: !!user,
        loading,
        getAccessToken,
        signUp,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
