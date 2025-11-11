"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { getProfile, updateProfile, updateEmail, checkUsernameAvailability, type ProfileData } from "@/app/actions/profile";
import { showToast } from "./Toast";
import { supabase } from "@/lib/supabase";

type ProfileTabProps = {
  onSaveButtonRender?: (button: JSX.Element) => void;
};

export default function ProfileTab({ onSaveButtonRender }: ProfileTabProps = {}) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [initialProfile, setInitialProfile] = useState<ProfileData | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [emailVerificationMessage, setEmailVerificationMessage] = useState<string | null>(null);
  const usernameCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get browser defaults
  const browserTimezone = typeof window !== 'undefined' 
    ? Intl.DateTimeFormat().resolvedOptions().timeZone 
    : 'UTC';
  const browserLocale = typeof window !== 'undefined'
    ? Intl.DateTimeFormat().resolvedOptions().locale.split('-')[0]
    : 'en';

  useEffect(() => {
    loadProfile();
    
    // Cleanup timeout on unmount
    return () => {
      if (usernameCheckTimeoutRef.current) {
        clearTimeout(usernameCheckTimeoutRef.current);
      }
    };
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    const result = await getProfile();
    if (result.ok && result.data) {
      // Apply browser defaults if not set
      const profileData = {
        ...result.data,
        timezone: result.data.timezone && result.data.timezone !== 'UTC' 
          ? result.data.timezone 
          : browserTimezone,
      };
      setProfile(profileData);
      setInitialProfile(profileData);
    } else {
      showToast(result.message || "Failed to load profile", "error");
    }
    setLoading(false);
  };

  const handleUsernameChange = (value: string) => {
    if (!profile) return;
    
    const lowerValue = value.toLowerCase();
    setProfile({ ...profile, username: lowerValue });
    setFieldErrors(prev => {
      const next = { ...prev };
      delete next.username;
      return next;
    });
    setUsernameAvailable(null);

    // Clear existing timeout
    if (usernameCheckTimeoutRef.current) {
      clearTimeout(usernameCheckTimeoutRef.current);
    }

    // Debounce username check
    if (lowerValue.trim() === '') {
      setUsernameAvailable(null);
      return;
    }

    const usernameRegex = /^[a-z0-9_]{3,24}$/;
    if (!usernameRegex.test(lowerValue)) {
      setUsernameAvailable(false);
      return;
    }

    usernameCheckTimeoutRef.current = setTimeout(async () => {
      setUsernameChecking(true);
      const result = await checkUsernameAvailability(lowerValue);
      setUsernameChecking(false);
      if (result.ok && result.data) {
        setUsernameAvailable(result.data.available);
      }
    }, 500);
  };


  const handleSave = useCallback(async () => {
    if (!profile || !initialProfile) return;

    // Check if anything changed
    const hasChanges = 
      profile.display_name !== initialProfile.display_name ||
      profile.username !== initialProfile.username ||
      profile.timezone !== initialProfile.timezone;

    if (!hasChanges) {
      showToast('No changes to save', 'info');
      return;
    }

    setSaving(true);
    setFieldErrors({});

    const result = await updateProfile({
      display_name: profile.display_name || undefined,
      username: profile.username || null,
      timezone: profile.timezone,
    });

    if (result.ok) {
      setInitialProfile(profile);
      showToast(result.message || 'Profile updated successfully', 'success');
    } else {
      if (result.fieldErrors) {
        setFieldErrors(result.fieldErrors);
        // If username is taken, update the availability state
        if (result.fieldErrors.username && result.fieldErrors.username.includes('taken')) {
          setUsernameAvailable(false);
        }
      }
      showToast(result.message || 'Failed to update profile', 'error');
    }

    setSaving(false);
  }, [profile, initialProfile]);

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    const form = e.currentTarget as HTMLFormElement;
    const formData = new FormData(form);
    const newEmail = formData.get('email') as string;

    if (newEmail === profile.email) {
      return;
    }

    const result = await updateEmail(newEmail);
    if (result.ok) {
      setEmailVerificationMessage(result.message || '');
      setFieldErrors(prev => {
        const next = { ...prev };
        delete next.email;
        return next;
      });
      showToast(result.message || 'Verification email sent', 'success');
    } else {
      if (result.fieldErrors) {
        setFieldErrors(result.fieldErrors);
      }
      // Show both inline error and toast for email update failures
      const errorMsg = result.message || 'Failed to update email';
      if (!result.fieldErrors?.email) {
        setFieldErrors(prev => ({ ...prev, email: errorMsg }));
      }
      showToast(errorMsg, 'error');
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

  // Get timezone options
  const timezones = Intl.supportedValuesOf('timeZone');

  // Expose Save button to parent if callback provided
  // This must be called before any early returns to follow Rules of Hooks
  useEffect(() => {
    if (!onSaveButtonRender || loading || !profile || !initialProfile) {
      return;
    }

    const hasChanges = 
      profile.display_name !== initialProfile.display_name ||
      profile.username !== initialProfile.username ||
      profile.timezone !== initialProfile.timezone;

    const saveButton = (
      <button
        onClick={handleSave}
        disabled={!hasChanges || saving}
        className="btn w-full disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
    );
    onSaveButtonRender(saveButton);
  }, [onSaveButtonRender, saving, loading, profile, initialProfile, handleSave]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="text-neutral-500 text-sm">Loading profile...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="space-y-4">
        <div className="text-red-400 text-sm">Failed to load profile</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Picture - Initials Only */}
      <div>
        <label className="label mb-2">Profile Picture</label>
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0 w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500/50 flex items-center justify-center text-emerald-400 font-semibold text-base" style={{ aspectRatio: '1 / 1' }}>
            {getInitials(profile.display_name, profile.email)}
          </div>
          <p className="text-sm text-neutral-500">
            Profile pictures are displayed as initials based on your name or email.
          </p>
        </div>
      </div>

      {/* Display Name */}
      <div>
        <label className="label mb-2">Full Name</label>
        <input
          className="input"
          type="text"
          value={profile.display_name || ''}
          onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
          placeholder="Enter your name"
        />
      </div>

      {/* Email */}
      <div>
        <label className="label mb-2">Email</label>
        <form onSubmit={handleEmailChange} className="space-y-2">
          <input
            className="input"
            type="email"
            name="email"
            defaultValue={profile.email}
            placeholder="your@email.com"
          />
          {fieldErrors.email && (
            <p className="text-sm text-red-400">{fieldErrors.email}</p>
          )}
          <button type="submit" className="btn text-sm">
            Change Email
          </button>
        </form>
        {emailVerificationMessage && (
          <div className="mt-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/50 text-blue-400 text-sm">
            {emailVerificationMessage}
          </div>
        )}
      </div>

      {/* Username */}
      <div>
        <label className="label mb-2">Username (optional)</label>
        <div className="space-y-1">
          <input
            className="input"
            type="text"
            value={profile.username || ''}
            onChange={(e) => handleUsernameChange(e.target.value)}
            placeholder="username"
            pattern="[a-z0-9_]{3,24}"
          />
          {usernameChecking && (
            <p className="text-sm text-neutral-500">Checking availability...</p>
          )}
          {!usernameChecking && usernameAvailable !== null && profile.username && (
            <p className={`text-sm ${usernameAvailable ? 'text-emerald-400' : 'text-red-400'}`}>
              {usernameAvailable ? '✓ Available' : '✗ Taken'}
            </p>
          )}
          {fieldErrors.username && (
            <p className="text-sm text-red-400">{fieldErrors.username}</p>
          )}
          <p className="text-xs text-neutral-500">
            3-24 characters, lowercase letters, numbers, and underscores only
          </p>
        </div>
      </div>

      {/* Timezone */}
      <div>
        <label className="label mb-2">Timezone</label>
        <select
          className="select"
          value={profile.timezone}
          onChange={(e) => setProfile({ ...profile, timezone: e.target.value })}
        >
          {timezones.map((tz) => (
            <option key={tz} value={tz}>
              {tz.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
      </div>

    </div>
  );
}

