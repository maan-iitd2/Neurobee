/**
 * Profile store for NeuroBee.
 *
 * Simple local-first profile — no passwords, no email, no auth.
 * Just stores the parent + child information needed for the app.
 */

export interface Profile {
  parentName: string;
  childName: string;
  childDob: string; // YYYY-MM (day not needed)
}

const PROFILE_KEY = "neurobee_profile";

export function getProfile(): Profile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.parentName && parsed?.childName && parsed?.childDob) {
      return parsed as Profile;
    }
    return null;
  } catch {
    return null;
  }
}

export function saveProfile(profile: Profile): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function clearProfile(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(PROFILE_KEY);
}

export function computeChildAge(dob: string): number {
  // dob is "YYYY-MM"
  const [yearStr, monthStr] = dob.split("-");
  const birthYear = parseInt(yearStr, 10);
  const birthMonth = parseInt(monthStr, 10) - 1; // 0-indexed
  const today = new Date();
  let age = today.getFullYear() - birthYear;
  if (today.getMonth() < birthMonth) age--;
  return Math.max(0, age);
}

/**
 * Returns child age in months for more precise display with young children.
 */
export function computeChildAgeMonths(dob: string): number {
  const [yearStr, monthStr] = dob.split("-");
  const birthYear = parseInt(yearStr, 10);
  const birthMonth = parseInt(monthStr, 10) - 1;
  const today = new Date();
  return (today.getFullYear() - birthYear) * 12 + (today.getMonth() - birthMonth);
}
