// NOTE: SHA-256 with salt is used here for a local-only app (no data leaves the device).
// For a networked production app, use bcrypt or Argon2 server-side.

export interface StoredUser {
  id: string;
  email: string;
  parentName: string;
  childName: string;
  childDob: string; // YYYY-MM-DD
  passwordHash: string;
  salt: string;
  createdAt: string;
}

export interface AuthStorage {
  users: StoredUser[];
  currentUserId: string | null;
  sessionToken: string | null;
}

const AUTH_KEY = "neurobee_auth";

function generateId(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function sha256(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hashPassword(password: string, salt: string): Promise<string> {
  return sha256(password + salt);
}

export function loadAuthStorage(): AuthStorage {
  if (typeof window === "undefined") return { users: [], currentUserId: null, sessionToken: null };
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? JSON.parse(raw) : { users: [], currentUserId: null, sessionToken: null };
  } catch {
    return { users: [], currentUserId: null, sessionToken: null };
  }
}

function saveAuthStorage(data: AuthStorage): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTH_KEY, JSON.stringify(data));
}

export function getCurrentUser(): StoredUser | null {
  const auth = loadAuthStorage();
  if (!auth.currentUserId || !auth.sessionToken) return null;
  return auth.users.find((u) => u.id === auth.currentUserId) ?? null;
}

export function computeChildAge(dob: string): number {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return Math.max(0, age);
}

export interface SignupData {
  parentName: string;
  email: string;
  password: string;
  childName: string;
  childDob: string; // YYYY-MM-DD
}

export async function signup(data: SignupData): Promise<{ success: boolean; error?: string }> {
  const auth = loadAuthStorage();

  if (auth.users.some((u) => u.email.toLowerCase() === data.email.toLowerCase())) {
    return { success: false, error: "An account with this email already exists." };
  }

  const salt = generateId();
  const passwordHash = await hashPassword(data.password, salt);

  const newUser: StoredUser = {
    id: generateId(),
    email: data.email.trim().toLowerCase(),
    parentName: data.parentName.trim(),
    childName: data.childName.trim(),
    childDob: data.childDob,
    passwordHash,
    salt,
    createdAt: new Date().toISOString(),
  };

  const sessionToken = generateId();
  auth.users.push(newUser);
  auth.currentUserId = newUser.id;
  auth.sessionToken = sessionToken;
  saveAuthStorage(auth);

  return { success: true };
}

export async function login(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  const auth = loadAuthStorage();
  const user = auth.users.find((u) => u.email === email.trim().toLowerCase());

  if (!user) {
    return { success: false, error: "No account found with this email." };
  }

  const hash = await hashPassword(password, user.salt);
  if (hash !== user.passwordHash) {
    return { success: false, error: "Incorrect password. Please try again." };
  }

  auth.currentUserId = user.id;
  auth.sessionToken = generateId();
  saveAuthStorage(auth);

  return { success: true };
}

export function logout(): void {
  const auth = loadAuthStorage();
  auth.currentUserId = null;
  auth.sessionToken = null;
  saveAuthStorage(auth);
}
