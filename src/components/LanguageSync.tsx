"use client";

import { useEffect } from "react";
import { useProfile } from "@/context/ProfileContext";

/**
 * Keeps document.documentElement.lang in sync with the profile language.
 * Rendered inside ProfileProvider so it has access to the profile.
 */
export function LanguageSync() {
  const { profile } = useProfile();

  useEffect(() => {
    const lang = profile?.language ?? "en";
    document.documentElement.lang = lang === "hi" ? "hi" : "en";
  }, [profile?.language]);

  return null;
}
