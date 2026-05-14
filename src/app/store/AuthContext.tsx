import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { identify, track } from "../utils/analytics";

export interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<User>;
  signUp: (name: string, email: string, password: string) => Promise<User>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = "hoodude.user.v1";

function readStorage(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => readStorage());

  useEffect(() => {
    try {
      if (user) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      else window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, [user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: !!user,
      async signIn(email, password) {
        if (!email.includes("@") || !email.includes(".")) {
          throw new Error("Enter a valid email address.");
        }
        if (!password || password.length < 8) {
          throw new Error("Password must be at least 8 characters.");
        }
        await new Promise((r) => setTimeout(r, 350));
        const next: User = {
          id: crypto.randomUUID(),
          email,
          name: email.split("@")[0] || "Member",
        };
        setUser(next);
        identify(next.id, { email: next.email });
        track("sign_in", { method: "password" });
        return next;
      },
      async signUp(name, email, password) {
        if (!name.trim() || name.trim().length < 2) {
          throw new Error("Please enter your name.");
        }
        if (!email.includes("@") || !email.includes(".")) {
          throw new Error("Enter a valid email address.");
        }
        if (!password || password.length < 8) {
          throw new Error("Password must be at least 8 characters.");
        }
        await new Promise((r) => setTimeout(r, 350));
        const next: User = { id: crypto.randomUUID(), email, name: name.trim() };
        setUser(next);
        identify(next.id, { email: next.email, name: next.name });
        track("sign_up", { method: "password" });
        return next;
      },
      signOut() {
        track("sign_out");
        setUser(null);
      },
    }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
