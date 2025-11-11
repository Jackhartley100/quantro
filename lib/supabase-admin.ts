/**
 * Server-only helper for creating Supabase admin client.
 * Requires SUPABASE_SERVICE_ROLE_KEY to be set (optional).
 * 
 * This is gated behind a feature flag - if the service role key is not available,
 * the function returns null and the calling code should handle gracefully.
 */

import 'server-only'
import { createClient as createAdminClient } from '@supabase/supabase-js'

/**
 * Creates an admin Supabase client if service role key is available.
 * Returns null if the key is not set (feature disabled).
 */
export function createAdminSupabaseClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!serviceRoleKey) {
    return null
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is required')
  }

  return createAdminClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

/**
 * Checks if admin features are available (service role key is set).
 */
export function isAdminFeaturesEnabled(): boolean {
  return !!process.env.SUPABASE_SERVICE_ROLE_KEY
}

