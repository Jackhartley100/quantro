'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function SignupPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Check if user is already logged in
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        router.push('/dashboard')
      }
    })
  }, [router])

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nameError, setNameError] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [generalError, setGeneralError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950 px-4 py-12">
        <div className="w-full max-w-[420px]">
          <div className="rounded-[28px] border border-neutral-800 bg-neutral-900/60 backdrop-blur shadow-lg px-6 py-8">
            <h1 className="text-3xl md:text-4xl font-bold text-neutral-100">Create your account</h1>
            <div className="text-sm text-neutral-500 mt-2">Loading...</div>
          </div>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setNameError(null)
    setEmailError(null)
    setPasswordError(null)
    setGeneralError(null)

    // Validate password length
    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters')
      return
    }

    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: name || undefined,
          },
        },
      })

      if (error) {
        // Check for specific error types
        if (error.message.includes('email') || error.message.includes('Email')) {
          setEmailError(error.message)
        } else if (error.message.includes('password') || error.message.includes('Password')) {
          setPasswordError(error.message)
        } else {
          setGeneralError(error.message)
        }
      } else {
        // Try to update profile with display_name if user is authenticated
        if (data.user && name) {
          try {
            const { error: profileError } = await supabase
              .from('profiles')
              .update({ display_name: name })
              .eq('id', data.user.id)
            
            // Silently fail if profile update fails (profile might not exist yet or user not confirmed)
            if (profileError) {
              console.log('Profile update skipped:', profileError.message)
            }
          } catch (profileErr) {
            // Silently fail - profile will be updated on first login
            console.log('Profile update skipped')
          }
        }
        
        // Show confirmation screen
        setShowConfirmation(true)
      }
    } catch (err) {
      setGeneralError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const currentYear = new Date().getFullYear()

  if (showConfirmation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950 px-4 py-12">
        <div className="w-full max-w-[420px]">
          <div className="rounded-[28px] border border-neutral-800 bg-neutral-900/60 backdrop-blur shadow-lg px-6 py-8 space-y-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-neutral-100">Check your email.</h1>
              <p className="text-sm text-neutral-500 mt-2">
                We&apos;ve sent a link to confirm your account.
              </p>
            </div>

            <Link
              href="/login"
              className="w-full rounded-lg px-4 py-3 font-medium bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white text-center block transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-neutral-900"
            >
              Back to sign in
            </Link>

            <div className="text-center text-xs text-neutral-600 pt-4 border-t border-neutral-800">
              © Quantro {currentYear}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 px-4 py-12">
      <div className="w-full max-w-[420px]">
        <div className="rounded-[28px] border border-neutral-800 bg-neutral-900/60 backdrop-blur shadow-lg px-6 py-8 space-y-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-neutral-100">Create your account</h1>
            <p className="text-sm text-neutral-500 mt-2">Let&apos;s get you set up.</p>
          </div>

          {generalError && (
            <div className="text-red-400 text-sm bg-red-950/20 border border-red-900/50 rounded-lg px-3 py-2">
              {generalError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="name" className="block text-sm text-neutral-400">
                Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setNameError(null)
                }}
                disabled={loading}
                autoComplete="name"
                className="w-full rounded-lg bg-neutral-900 border border-neutral-800 px-3 py-2.5 text-neutral-100 placeholder-neutral-500 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                placeholder="Your name"
              />
              {nameError && (
                <div className="text-red-400 text-xs mt-1">{nameError}</div>
              )}
            </div>

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
              <label htmlFor="password" className="block text-sm text-neutral-400">
                Password
              </label>
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
                autoComplete="new-password"
                minLength={8}
                className="w-full rounded-lg bg-neutral-900 border border-neutral-800 px-3 py-2.5 text-neutral-100 placeholder-neutral-500 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                placeholder="Enter your password"
              />
              <div className="text-xs text-neutral-600 mt-1">At least 8 characters.</div>
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
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <div className="text-center text-sm text-neutral-400">
            Already have an account?{' '}
            <Link href="/login" className="text-emerald-500 hover:text-emerald-400 transition-colors">
              Sign in
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
