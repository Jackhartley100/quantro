/**
 * Server-only helper for creating Supabase client with service role key for write operations.
 * This bypasses RLS policies and should only be used in server actions and route handlers
 * after proper user authentication has been verified.
 * 
 * Requires SUPABASE_SERVICE_ROLE_KEY to be set (optional).
 * Falls back to regular server client if service role key is not available.
 */

import 'server-only'
import { createClient as createRegularClient } from '@/lib/supabase-server'
import { createAdminSupabaseClient } from '@/lib/supabase-admin'

/**
 * Gets a Supabase client for write operations.
 * Uses service role key if available, otherwise falls back to regular client.
 * 
 * IMPORTANT: Always verify user authentication before using this for writes.
 * The service role key bypasses RLS, so you must manually check user permissions.
 */
export async function getWriteClient() {
  const adminClient = createAdminSupabaseClient()
  
  if (adminClient) {
    return adminClient
  }
  
  // Fallback to regular client (uses anon key, respects RLS)
  return await createRegularClient()
}

