"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import {
  getProfile as loadProfile,
  saveProfile as storeProfile,
  clearProfile as removeProfile,
  computeChildAge,
  Profile,
} from "@/lib/profile";
import { OnboardingScreen } from "@/components/OnboardingScreen";

export interface ProfileUser {
  parentName: string;
  childName: string;
  childDob: string;
  childAge: number;
  language: "en" | "hi";
}

interface ProfileContextValue {
  profile: ProfileUser | null;
  isLoading: boolean;
  saveProfile: (data: Profile) => void;
  resetProfile: () => void;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

function toProfileUser(p: Profile): ProfileUser {
  return {
    parentName: p.parentName,
    childName: p.childName,
    childDob: p.childDob,
    childAge: computeChildAge(p.childDob),
    language: p.language ?? "en",
  };
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<ProfileUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Hydrate on mount — localStorage is only available on the client, so
  // setState must be called inside useEffect here (SSR-safe pattern).
  useEffect(() => {
    const stored = loadProfile();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProfile(stored ? toProfileUser(stored) : null);
    setIsLoading(false);
  }, []);

  const saveProfile = useCallback((data: Profile) => {
    storeProfile(data);
    setProfile(toProfileUser(data));
  }, []);

  const resetProfile = useCallback(() => {
    removeProfile();
    if (typeof window !== "undefined") {
      localStorage.removeItem("neurobee_state");
    }
    setProfile(null);
  }, []);

  // Loading screen — uses a plain <img> (not next/image) so that server
  // and client produce byte-identical HTML during hydration.
  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/Logo.png"
          alt="Loading NeuroBee..."
          width={64}
          height={64}
          className="animate-pulse object-contain"
        />
      </div>
    );
  }

  return (
    <ProfileContext.Provider value={{ profile, isLoading, saveProfile, resetProfile }}>
      {profile ? children : <OnboardingScreen />}
    </ProfileContext.Provider>
  );
}

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used within ProfileProvider");
  return ctx;
}
