"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { getProfile, type ProfileData } from "@/app/actions/profile";

export default function UserBlock({ onProfileClick }: { onProfileClick?: () => void }) {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const result = await getProfile();
      if (result.ok && result.data) {
        setProfile(result.data);
      } else {
        setError(result.message || 'Failed to load profile');
        // Fallback: try to get user email directly
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
          setProfile({
            id: user.id,
            email: user.email,
            display_name: null,
            username: null,
            avatar_url: null, // Not used, but kept for type compatibility
            timezone: 'UTC',
            locale: 'en',
          });
        }
      }
    } catch (err) {
      console.error('Error loading profile:', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs sm:text-sm whitespace-nowrap flex-shrink-0">
        <div className="w-5 h-5 rounded-full bg-neutral-800 animate-pulse" />
        <div className="h-4 w-20 bg-neutral-800 rounded animate-pulse" />
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const displayName = profile.display_name || profile.email.split('@')[0];
  const initials = getInitials(profile.display_name, profile.email);

  return (
    <div 
      onClick={onProfileClick}
      className="flex items-center gap-2 text-xs sm:text-sm whitespace-nowrap flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
    >
      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-semibold text-[10px]" style={{ aspectRatio: '1 / 1' }}>
        {initials}
      </div>
      <span className="text-neutral-100">
        {displayName}
      </span>
    </div>
  );
}

