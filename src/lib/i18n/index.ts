"use client";

import { useProfile } from "@/context/ProfileContext";
import { en } from "./en";
import { hi } from "./hi";
import type { Language } from "./types";

export type { Language };

/**
 * Returns a translation function bound to the current profile language.
 * Pass an optional `override` to force a specific language (used in
 * OnboardingScreen before a profile exists).
 */
export function useTranslation(override?: Language) {
  const { profile } = useProfile();
  const lang: Language = override ?? profile?.language ?? "en";
  const dict = lang === "hi" ? hi : en;
  return (key: string): string => dict[key] ?? key;
}
