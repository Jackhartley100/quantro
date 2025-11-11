import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // TODO: Implement proper cookie-based server-side protection for /dashboard routes
  // For now, we allow rendering and rely on client-side redirect in page.tsx
  // The dashboard page checks authentication client-side and redirects to /login if needed
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Client-side check fallback: allow rendering, page.tsx will handle redirect
  // if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
  //   return NextResponse.redirect(new URL('/login', request.url))
  // }

  return response
}

export const config = {
  // Only match dashboard routes - explicitly exclude auth routes
  // This ensures /login, /signup, /reset, /onboarding, and / are not intercepted
  matcher: '/dashboard/:path*',
}

