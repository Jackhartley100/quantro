/**
 * Tour visibility resolver
 * Returns SHOW, HIDE, or UNKNOWN based on DB and localStorage state
 */

export type TourVisibility = 'SHOW' | 'HIDE' | 'UNKNOWN';

export interface TourState {
  dbHasSeenTour: boolean | null; // null = loading/unknown
  dbTourDismissedAt: string | null;
  localStorageHasSeenTour: boolean | null; // null = not checked yet
}

/**
 * Determines if tour should be shown based on DB and localStorage
 * 
 * Rules:
 * - SHOW: Both DB and localStorage say not seen (or missing)
 * - HIDE: Either DB or localStorage says seen
 * - UNKNOWN: DB state is still loading
 */
export function shouldShowTour(state: TourState): TourVisibility {
  // If DB state is unknown, return UNKNOWN (don't render modal)
  if (state.dbHasSeenTour === null) {
    return 'UNKNOWN';
  }

  // If DB says seen, hide (DB is authoritative)
  if (state.dbHasSeenTour === true || state.dbTourDismissedAt !== null) {
    return 'HIDE';
  }

  // If localStorage says seen, hide (even if DB doesn't yet - race condition guard)
  if (state.localStorageHasSeenTour === true) {
    return 'HIDE';
  }

  // Both sources say not seen
  return 'SHOW';
}

/**
 * Check localStorage for has_seen_tour flag
 * Uses user-specific key: has_seen_tour_{userId}
 */
export function getLocalStorageTourState(userId: string | null): boolean | null {
  if (typeof window === 'undefined' || !userId) {
    return null;
  }

  try {
    const value = localStorage.getItem(`has_seen_tour_${userId}`);
    return value === 'true';
  } catch (error) {
    console.error('Error reading localStorage:', error);
    return null;
  }
}

/**
 * Set localStorage has_seen_tour flag
 */
export function setLocalStorageTourSeen(userId: string | null): void {
  if (typeof window === 'undefined' || !userId) {
    return;
  }

  try {
    localStorage.setItem(`has_seen_tour_${userId}`, 'true');
  } catch (error) {
    console.error('Error writing to localStorage:', error);
  }
}

/**
 * Clear localStorage has_seen_tour flag (for testing/re-run)
 */
export function clearLocalStorageTourSeen(userId: string | null): void {
  if (typeof window === 'undefined' || !userId) {
    return;
  }

  try {
    localStorage.removeItem(`has_seen_tour_${userId}`);
  } catch (error) {
    console.error('Error clearing localStorage:', error);
  }
}

