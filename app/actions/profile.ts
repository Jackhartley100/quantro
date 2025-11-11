'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export type ProfileData = {
  id: string
  email: string
  display_name: string | null
  username: string | null
  avatar_url: string | null
  timezone: string
  locale: string
  has_seen_tour: boolean
  tour_dismissed_at: string | null
  monthly_net_goal: number | null
}

export type ActionResult<T = void> = {
  ok: boolean
  message?: string
  fieldErrors?: Record<string, string>
  data?: T
}

export async function getProfile(): Promise<ActionResult<ProfileData>> {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { ok: false, message: 'Unauthorized' }
    }

    // Get profile, create if doesn't exist
    let { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError && profileError.code === 'PGRST116') {
      // Profile doesn't exist, create it
      const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
      const browserLocale = Intl.DateTimeFormat().resolvedOptions().locale.split('-')[0]
      
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          timezone: browserTimezone,
          locale: browserLocale,
          has_seen_tour: false,
        })
        .select()
        .single()

      if (insertError) {
        return { ok: false, message: `Failed to create profile: ${insertError.message}` }
      }

      profile = newProfile
    } else if (profileError) {
      return { ok: false, message: `Failed to load profile: ${profileError.message}` }
    }

    return {
      ok: true,
      data: {
        id: user.id,
        email: user.email || '',
        display_name: profile.display_name,
        username: profile.username,
        avatar_url: profile.avatar_url,
        timezone: profile.timezone || 'UTC',
        locale: profile.locale || 'en',
        has_seen_tour: profile.has_seen_tour ?? false,
        tour_dismissed_at: profile.tour_dismissed_at || null,
        monthly_net_goal: profile.monthly_net_goal ? Number(profile.monthly_net_goal) : null,
      },
    }
  } catch (error) {
    console.error('Error getting profile:', error)
    return { ok: false, message: 'An unexpected error occurred' }
  }
}

export async function updateProfile(data: {
  display_name?: string
  username?: string | null
  timezone?: string
  locale?: string
}): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { ok: false, message: 'Unauthorized' }
    }

    const fieldErrors: Record<string, string> = {}

    // Validate username if provided
    if (data.username !== undefined) {
      if (data.username === null || data.username === '') {
        // Allow clearing username
      } else {
        const usernameRegex = /^[a-z0-9_]{3,24}$/
        if (!usernameRegex.test(data.username)) {
          fieldErrors.username = 'Username must be 3-24 characters, lowercase letters, numbers, and underscores only'
        } else {
          // Check uniqueness
          const { data: existing, error: checkError } = await supabase
            .from('profiles')
            .select('id')
            .eq('username', data.username)
            .neq('id', user.id)
            .single()

          if (checkError && checkError.code !== 'PGRST116') {
            return { ok: false, message: `Failed to check username: ${checkError.message}` }
          }

          if (existing) {
            fieldErrors.username = 'This username is already taken'
          }
        }
      }
    }

    if (Object.keys(fieldErrors).length > 0) {
      return { ok: false, fieldErrors }
    }

    // Update profile
    const updateData: any = {}
    if (data.display_name !== undefined) updateData.display_name = data.display_name || null
    if (data.username !== undefined) updateData.username = data.username || null
    if (data.timezone !== undefined) updateData.timezone = data.timezone
    if (data.locale !== undefined) updateData.locale = data.locale

    const { error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user.id)

    if (updateError) {
      // Check for unique constraint violation
      if (updateError.code === '23505') {
        return { ok: false, fieldErrors: { username: 'This username is already taken' } }
      }
      return { ok: false, message: `Failed to update profile: ${updateError.message}` }
    }

    revalidatePath('/dashboard')
    return { ok: true, message: 'Profile updated successfully' }
  } catch (error) {
    console.error('Error updating profile:', error)
    return { ok: false, message: 'An unexpected error occurred' }
  }
}

export async function checkUsernameAvailability(username: string): Promise<ActionResult<{ available: boolean }>> {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { ok: false, message: 'Unauthorized' }
    }

    if (!username || username.trim() === '') {
      return { ok: true, data: { available: true } }
    }

    const usernameRegex = /^[a-z0-9_]{3,24}$/
    if (!usernameRegex.test(username)) {
      return { ok: false, message: 'Invalid username format' }
    }

    const { data: existing, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .neq('id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      return { ok: false, message: `Failed to check username: ${error.message}` }
    }

    return { ok: true, data: { available: !existing } }
  } catch (error) {
    console.error('Error checking username:', error)
    return { ok: false, message: 'An unexpected error occurred' }
  }
}

export async function uploadAvatar(formData: FormData): Promise<ActionResult<{ avatar_url: string }>> {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { ok: false, message: 'Unauthorized' }
    }

    const file = formData.get('file') as File | null
    if (!file) {
      return { ok: false, message: 'No file provided' }
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return { ok: false, message: 'Invalid file type. Please upload JPG, PNG, or WebP' }
    }

    // Validate file size (10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return { ok: false, message: 'File size must be less than 10MB' }
    }

    // Get file extension
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const fileName = `avatar.${ext}`
    const filePath = `avatars/${user.id}/${fileName}`

    // Upload file (overwrite if exists)
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        upsert: true,
        contentType: file.type,
      })

    if (uploadError) {
      return { ok: false, message: `Failed to upload avatar: ${uploadError.message}` }
    }

    // Get public URL (assuming bucket is public) or signed URL
    // For now, we'll use public URL. If bucket is private, use getPublicUrl or createSignedUrl
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath)

    const avatarUrl = urlData.publicUrl

    // Update profile with avatar URL
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: avatarUrl })
      .eq('id', user.id)

    if (updateError) {
      return { ok: false, message: `Failed to update profile: ${updateError.message}` }
    }

    revalidatePath('/dashboard')
    return { ok: true, data: { avatar_url: avatarUrl }, message: 'Avatar uploaded successfully' }
  } catch (error) {
    console.error('Error uploading avatar:', error)
    return { ok: false, message: 'An unexpected error occurred' }
  }
}

export async function removeAvatar(): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { ok: false, message: 'Unauthorized' }
    }

    // Get current avatar URL to delete from storage
    const { data: profile } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', user.id)
      .single()

    if (profile?.avatar_url) {
      // Extract path from URL
      const urlParts = profile.avatar_url.split('/avatars/')
      if (urlParts.length > 1) {
        const filePath = `avatars/${urlParts[1]}`
        await supabase.storage.from('avatars').remove([filePath])
      }
    }

    // Update profile to remove avatar URL
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: null })
      .eq('id', user.id)

    if (updateError) {
      return { ok: false, message: `Failed to remove avatar: ${updateError.message}` }
    }

    revalidatePath('/dashboard')
    return { ok: true, message: 'Avatar removed successfully' }
  } catch (error) {
    console.error('Error removing avatar:', error)
    return { ok: false, message: 'An unexpected error occurred' }
  }
}

export async function updateEmail(newEmail: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { ok: false, message: 'Unauthorized' }
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newEmail)) {
      return { ok: false, fieldErrors: { email: 'Invalid email address' } }
    }

    // Update email (Supabase will send verification email)
    const { error: updateError } = await supabase.auth.updateUser({
      email: newEmail,
    })

    if (updateError) {
      return { ok: false, message: `Failed to update email: ${updateError.message}` }
    }

    return { 
      ok: true, 
      message: `We've sent a verification link to ${newEmail}. Your email will update when confirmed.` 
    }
  } catch (error) {
    console.error('Error updating email:', error)
    return { ok: false, message: 'An unexpected error occurred' }
  }
}

export async function markTourAsSeen(): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { ok: false, message: 'Unauthorized' }
    }

    // Update both has_seen_tour and tour_dismissed_at atomically
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        has_seen_tour: true,
        tour_dismissed_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (updateError) {
      return { ok: false, message: `Failed to update tour status: ${updateError.message}` }
    }

    revalidatePath('/dashboard')
    return { ok: true, message: 'Tour marked as seen' }
  } catch (error) {
    console.error('Error marking tour as seen:', error)
    return { ok: false, message: 'An unexpected error occurred' }
  }
}

export async function resetTour(): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { ok: false, message: 'Unauthorized' }
    }

    // Reset tour flags (for "Re-run tour" feature - only resets DB, not localStorage)
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        has_seen_tour: false,
        tour_dismissed_at: null
      })
      .eq('id', user.id)

    if (updateError) {
      return { ok: false, message: `Failed to reset tour: ${updateError.message}` }
    }

    revalidatePath('/dashboard')
    return { ok: true, message: 'Tour reset successfully' }
  } catch (error) {
    console.error('Error resetting tour:', error)
    return { ok: false, message: 'An unexpected error occurred' }
  }
}

export async function updateProfileSettings(data: {
  monthly_net_goal?: number | null
}): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { ok: false, message: 'Unauthorized' }
    }

    // Validate monthly_net_goal if provided
    if (data.monthly_net_goal !== undefined) {
      if (data.monthly_net_goal !== null && data.monthly_net_goal <= 0) {
        return { ok: false, message: 'Monthly net goal must be greater than 0' }
      }
    }

    // Update profile settings
    const updateData: any = {}
    if (data.monthly_net_goal !== undefined) {
      updateData.monthly_net_goal = data.monthly_net_goal === null || data.monthly_net_goal === 0 
        ? null 
        : data.monthly_net_goal
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user.id)

    if (updateError) {
      return { ok: false, message: `Failed to update settings: ${updateError.message}` }
    }

    revalidatePath('/dashboard')
    return { ok: true, message: 'Settings updated successfully' }
  } catch (error) {
    console.error('Error updating profile settings:', error)
    return { ok: false, message: 'An unexpected error occurred' }
  }
}

export async function deleteAccount(): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { ok: false, message: 'Unauthorized' }
    }

    // Delete avatar from storage if exists
    const { data: profile } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', user.id)
      .single()

    if (profile?.avatar_url) {
      const urlParts = profile.avatar_url.split('/avatars/')
      if (urlParts.length > 1) {
        const filePath = `avatars/${urlParts[1]}`
        await supabase.storage.from('avatars').remove([filePath])
      }
    }

    // Call API route to delete user account (uses admin client)
    const response = await fetch('/api/delete-account', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.json()
      return { ok: false, message: error.error || 'Failed to delete account' }
    }

    // Sign out the user
    await supabase.auth.signOut()
    
    return { ok: true, message: 'Account deleted successfully' }
  } catch (error) {
    console.error('Error deleting account:', error)
    return { ok: false, message: 'An unexpected error occurred' }
  }
}
