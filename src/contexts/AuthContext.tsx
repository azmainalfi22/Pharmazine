import React, { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Profile, UserRole, apiClient } from "@/integrations/api/client";
import { supabase } from "@/integrations/supabase/client";

import { logger } from "@/utils/logger";
interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  roles: UserRole[];
}

interface AuthContextType {
  user: User | null;
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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for existing session in localStorage
    const savedUser = localStorage.getItem("pharmazine_user");
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
      } catch (error) {
        logger.error("Error parsing saved user data:", error);
        localStorage.removeItem("pharmazine_user");
      }
    }
    setLoading(false);
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

        // Role-based post-login navigation
        const roleNames = (roles || []).map((r) => r.role);
        const isAdmin = roleNames.includes("admin");
        const isManager = roleNames.includes("manager");
        if (isAdmin) {
          navigate("/settings/system", { replace: true });
        } else if (isManager) {
          navigate("/reports", { replace: true });
        } else {
          navigate("/", { replace: true });
        }
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
    const { error } = await supabase.auth.signOut();
    if (error) {
      logger.error("Failed to sign out from Supabase:", error);
    }
    setUser(null);
    localStorage.removeItem("pharmazine_user");
    navigate("/auth");
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
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
