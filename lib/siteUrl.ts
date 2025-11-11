/**
 * Utility functions for getting the site URL.
 * 
 * Reads NEXT_PUBLIC_SITE_URL if set, otherwise derives from:
 * - Client: window.location
 * - Server: request URL
 */

/**
 * Get site URL on the client side.
 * Uses NEXT_PUBLIC_SITE_URL if set, otherwise derives from window.location.
 */
export function getSiteUrlClient(): string {
  if (typeof window === 'undefined') {
    throw new Error('getSiteUrlClient can only be called on the client')
  }

  // Use environment variable if set
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL
  }

  // Derive from window.location
  const { protocol, host } = window.location
  return `${protocol}//${host}`
}

/**
 * Get site URL on the server side.
 * Uses NEXT_PUBLIC_SITE_URL if set, otherwise derives from request URL.
 * 
 * @param request - Optional Request object to derive URL from
 */
export function getSiteUrlServer(request?: Request): string {
  // Use environment variable if set
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL
  }

  // Derive from request URL if provided
  if (request) {
    const url = new URL(request.url)
    return `${url.protocol}//${url.host}`
  }

  // Fallback: try to construct from common patterns
  // This is a last resort and may not work in all environments
  throw new Error(
    'Cannot determine site URL. Either set NEXT_PUBLIC_SITE_URL or provide a Request object.'
  )
}

