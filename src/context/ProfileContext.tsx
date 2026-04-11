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
  };
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<ProfileUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Hydrate on mount
  useEffect(() => {
    const stored = loadProfile();
    setProfile(stored ? toProfileUser(stored) : null);
    setIsLoading(false);
  }, []);

  const saveProfile = useCallback((data: Profile) => {
    storeProfile(data);
    setProfile(toProfileUser(data));
  }, []);

  const resetProfile = useCallback(() => {
    removeProfile();
    // Also clear app data
    if (typeof window !== "undefined") {
      localStorage.removeItem("neurobee_state");
    }
    setProfile(null);
  }, []);

  // Loading spinner while checking localStorage
  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <span
          className="material-symbols-outlined text-primary text-5xl animate-spin"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          hive
        </span>
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
