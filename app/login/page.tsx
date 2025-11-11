'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Check if user is already logged in
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        router.push('/dashboard')
      }
    })
  }, [router])
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailError, setEmailError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [generalError, setGeneralError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950 px-4 py-12">
        <div className="w-full max-w-[420px]">
          <div className="rounded-[28px] border border-neutral-800 bg-neutral-900/60 backdrop-blur shadow-lg px-6 py-8">
            <h1 className="text-3xl md:text-4xl font-bold text-neutral-100">Sign in</h1>
            <div className="text-sm text-neutral-500 mt-2">Loading...</div>
          </div>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setEmailError(null)
    setPasswordError(null)
    setGeneralError(null)
    setLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        // Check for specific error types
        if (error.message.includes('email') || error.message.includes('Email')) {
          setEmailError(error.message)
        } else if (error.message.includes('password') || error.message.includes('Password')) {
          setPasswordError(error.message)
        } else if (error.message.includes('Invalid') || error.message.includes('credentials')) {
          setGeneralError('Invalid email or password')
        } else {
          setGeneralError(error.message)
        }
      } else {
        router.push('/dashboard')
      }
    } catch (err) {
      setGeneralError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const currentYear = new Date().getFullYear()

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 px-4 py-12">
      <div className="w-full max-w-[420px]">
        <div className="rounded-[28px] border border-neutral-800 bg-neutral-900/60 backdrop-blur shadow-lg px-6 py-8 space-y-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-neutral-100">Sign in</h1>
            <p className="text-sm text-neutral-500 mt-2">Welcome back.</p>
          </div>

          {generalError && (
            <div className="text-red-400 text-sm bg-red-950/20 border border-red-900/50 rounded-lg px-3 py-2">
              {generalError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm text-neutral-400">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setEmailError(null)
                }}
                required
                disabled={loading}
                autoComplete="email"
                className="w-full rounded-lg bg-neutral-900 border border-neutral-800 px-3 py-2.5 text-neutral-100 placeholder-neutral-500 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                placeholder="you@example.com"
              />
              {emailError && (
                <div className="text-red-400 text-xs mt-1">{emailError}</div>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm text-neutral-400">
                  Password
                </label>
                <Link 
                  href="/reset" 
                  className="text-xs text-emerald-500 hover:text-emerald-400 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setPasswordError(null)
                }}
                required
                disabled={loading}
                autoComplete="current-password"
                className="w-full rounded-lg bg-neutral-900 border border-neutral-800 px-3 py-2.5 text-neutral-100 placeholder-neutral-500 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                placeholder="Enter your password"
              />
              {passwordError && (
                <div className="text-red-400 text-xs mt-1">{passwordError}</div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              aria-busy={loading}
              className="w-full rounded-lg px-4 py-3 font-medium bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white disabled:opacity-50 disabled:pointer-events-none transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-neutral-900"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="text-center text-sm text-neutral-400">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-emerald-500 hover:text-emerald-400 transition-colors">
              Create one
            </Link>
          </div>

          <div className="text-center text-xs text-neutral-600 pt-4 border-t border-neutral-800">
            © Quantro {currentYear}
          </div>
        </div>
      </div>
    </div>
  )
}
