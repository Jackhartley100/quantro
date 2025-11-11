'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function SetPasswordPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null)
  const [generalError, setGeneralError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950 px-4 py-12">
        <div className="w-full max-w-[420px]">
          <div className="rounded-[28px] border border-neutral-800 bg-neutral-900/60 backdrop-blur shadow-lg px-6 py-8">
            <h1 className="text-3xl md:text-4xl font-bold text-neutral-100">Set new password</h1>
            <div className="text-sm text-neutral-500 mt-2">Loading...</div>
          </div>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError(null)
    setConfirmPasswordError(null)
    setGeneralError(null)

    // Validate password length
    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters')
      return
    }

    // Validate passwords match
    if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      })

      if (error) {
        if (error.message.includes('password') || error.message.includes('Password')) {
          setPasswordError(error.message)
        } else {
          setGeneralError(error.message)
        }
      } else {
        setShowSuccess(true)
        // Redirect to login after 2 seconds
        setTimeout(() => {
          router.push('/login')
        }, 2000)
      }
    } catch (err) {
      setGeneralError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const currentYear = new Date().getFullYear()

  if (showSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950 px-4 py-12">
        <div className="w-full max-w-[420px]">
          <div className="rounded-[28px] border border-neutral-800 bg-neutral-900/60 backdrop-blur shadow-lg px-6 py-8 space-y-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-neutral-100">Password updated</h1>
              <p className="text-sm text-neutral-500 mt-2">
                Your password has been successfully updated. Redirecting to sign in...
              </p>
            </div>

            <Link
              href="/login"
              className="w-full rounded-lg px-4 py-3 font-medium bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white text-center block transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-neutral-900"
            >
              Go to sign in
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
            <h1 className="text-3xl md:text-4xl font-bold text-neutral-100">Set new password</h1>
            <p className="text-sm text-neutral-500 mt-2">Enter your new password below.</p>
          </div>

          {generalError && (
            <div className="text-red-400 text-sm bg-red-950/20 border border-red-900/50 rounded-lg px-3 py-2">
              {generalError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-sm text-neutral-400">
                New password
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
                placeholder="Enter your new password"
              />
              <div className="text-xs text-neutral-600 mt-1">At least 8 characters.</div>
              {passwordError && (
                <div className="text-red-400 text-xs mt-1">{passwordError}</div>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="confirmPassword" className="block text-sm text-neutral-400">
                Confirm password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value)
                  setConfirmPasswordError(null)
                }}
                required
                disabled={loading}
                autoComplete="new-password"
                minLength={8}
                className="w-full rounded-lg bg-neutral-900 border border-neutral-800 px-3 py-2.5 text-neutral-100 placeholder-neutral-500 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                placeholder="Confirm your new password"
              />
              {confirmPasswordError && (
                <div className="text-red-400 text-xs mt-1">{confirmPasswordError}</div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              aria-busy={loading}
              className="w-full rounded-lg px-4 py-3 font-medium bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white disabled:opacity-50 disabled:pointer-events-none transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-neutral-900"
            >
              {loading ? 'Updating password...' : 'Update password'}
            </button>
          </form>

          <div className="text-center text-sm text-neutral-400">
            Remember your password?{' '}
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

