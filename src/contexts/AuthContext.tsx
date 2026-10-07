import React, { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Profile, UserRole, apiClient } from "@/integrations/api/client";
import { supabase } from "@/integrations/supabase/client";

import { logger } from "@/utils/logger";
import { GUEST_PROFILE } from "@/guest/guestMode";

interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  roles: UserRole[];
}

interface AuthContextType {
  /** Signed-in user, or the local guest user when nobody is signed in. */
  user: User | null;
  /** True when browsing without an account (data lives in this browser only). */
  isGuest: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (
    fullName: string,
    email: string,
    password: string,
    phone?: string
  ) => Promise<boolean>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Visitors get full access to their own in-browser sandbox (see src/guest).
const GUEST_USER: User = {
  id: GUEST_PROFILE.id,
  email: GUEST_PROFILE.email,
  full_name: GUEST_PROFILE.full_name,
  roles: [{ role: "admin" } as UserRole],
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [authUser, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const isGuest = !authUser;
  const user = authUser ?? GUEST_USER;

  const clearSession = () => {
    apiClient.setToken(null);
    localStorage.removeItem("pharmazine_user");
    setUser(null);
  };

  useEffect(() => {
    const restoreSession = async () => {
      const savedUser = localStorage.getItem("pharmazine_user");
      const token = localStorage.getItem("token");
      if (!savedUser || !token) {
        // A half-saved session would mix guest UI with real API calls.
        if (savedUser || token) clearSession();
        setLoading(false);
        return;
      }
      try {
        const cached = JSON.parse(savedUser) as User;
        setUser(cached); // optimistic render while validating
        const freshProfile = await apiClient.getCurrentUser();
        if (!freshProfile) {
          // Token expired or invalid — fall back to guest mode
          clearSession();
        } else {
          const permsPayload = await apiClient.getUserPermissions().catch(() => null);
          const roles = permsPayload?.roles?.map((r: string) => ({ role: r })) || cached.roles;
          const updated: User = { ...cached, ...freshProfile, roles };
          setUser(updated);
          localStorage.setItem("pharmazine_user", JSON.stringify(updated));
        }
      } catch {
        clearSession();
      } finally {
        setLoading(false);
      }
    };
    restoreSession();
  }, []);

  const signIn = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);

      const authResult = await apiClient.authenticateUser(email, password);

      if (authResult?.profile) {
        const { profile, supabaseAccessToken, supabaseRefreshToken } =
          authResult;
        // Get roles from backend (backend resolves live Supabase role)
        // Fetch role/permissions from backend (source of truth: Supabase)
        const permsPayload = await apiClient.getUserPermissions().catch(() => null);
        const roles = permsPayload?.roles?.map((r: string) => ({ role: r })) || [];
        // Optional: set Supabase session for other features; ignore failures
        if (supabaseAccessToken && supabaseRefreshToken) {
          supabase.auth
            .setSession({
              access_token: supabaseAccessToken,
              refresh_token: supabaseRefreshToken,
            })
            .catch(() => {});
        }

        const userData: User = {
          id: profile.id,
          email: profile.email,
          full_name: profile.full_name,
          phone: profile.phone,
          roles: roles,
        };

        setUser(userData);
        localStorage.setItem("pharmazine_user", JSON.stringify(userData));

        // All users — regardless of role — land on the dashboard after login.
        navigate("/", { replace: true });
        return true;
      }

      return false;
    } catch (error) {
      logger.error("Sign in error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (
    fullName: string,
    email: string,
    password: string,
    phone?: string
  ): Promise<boolean> => {
    try {
      setLoading(true);

      await apiClient.registerUser({
        full_name: fullName,
        email,
        password,
        phone,
      });

      const signedIn = await signIn(email, password);
      if (!signedIn) {
        throw new Error(
          "Account was created, but sign-in failed. In Supabase → Authentication → Providers, ensure Email is enabled. Then try signing in manually with the same email and password."
        );
      }
      return true;
    } catch (error) {
      logger.error("Sign up error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await apiClient.logout();
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        logger.error("Failed to sign out from Supabase:", error);
      }
    } catch (error) {
      logger.error("Failed to sign out from Supabase:", error);
    }
    clearSession();
    // Back to the dashboard in guest mode rather than a login wall. A full
    // reload guarantees no signed-in data stays in any page's state.
    window.location.replace("/");
  };

  return (
    <AuthContext.Provider value={{ user, isGuest, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
