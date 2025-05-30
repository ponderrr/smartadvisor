// client/src/context/AuthContext.tsx
import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
} from "react";
import type { ReactNode } from "react";
import api from "../services/api";
import type { User } from "../services/api";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    username: string,
    password: string,
    age?: number
  ) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

// Helper function to validate token without making API calls
const isTokenValid = (tokenString: string): boolean => {
  try {
    const payload = JSON.parse(atob(tokenString.split(".")[1]));
    const isExpired = payload.exp * 1000 < Date.now() + 60000; // Add 1 minute buffer
    return !isExpired;
  } catch {
    return false;
  }
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  const setLoading = useCallback((isLoading: boolean) => {
    setState((prev) => ({ ...prev, isLoading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState((prev) => ({ ...prev, error }));
  }, []);

  const setUser = useCallback((user: User | null) => {
    setState((prev) => ({
      ...prev,
      user,
      isAuthenticated: !!user,
      error: null,
    }));
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, [setError]);

  // Initialize auth state on app load
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log("🔐 Initializing auth state...");

        // Check if we have tokens
        const storedTokens = localStorage.getItem("auth_tokens");
        if (!storedTokens) {
          console.log("📝 No stored tokens found - user not authenticated");
          if (mounted) {
            setLoading(false);
          }
          return;
        }

        // Parse and validate token structure
        let tokens;
        try {
          tokens = JSON.parse(storedTokens);
        } catch (error) {
          console.log("🚫 Invalid token format, clearing storage");
          localStorage.removeItem("auth_tokens");
          if (mounted) {
            setLoading(false);
          }
          return;
        }

        // Check if tokens have required fields
        if (
          !tokens.access_token ||
          !tokens.refresh_token ||
          !tokens.token_type
        ) {
          console.log("🚫 Incomplete token data, clearing storage");
          localStorage.removeItem("auth_tokens");
          if (mounted) {
            setLoading(false);
          }
          return;
        }

        // Only try to get current user if access token is valid
        if (isTokenValid(tokens.access_token)) {
          console.log("✅ Access token valid, getting current user...");
          try {
            const user = await api.getCurrentUser();
            if (mounted) {
              console.log("✅ User authenticated:", user.email);
              setUser(user);
            }
          } catch (error) {
            console.log("❌ Failed to get current user, but tokens exist");
            // Don't clear tokens here - let the API service handle refresh
            if (mounted) {
              setUser(null);
            }
          }
        } else {
          console.log("⏰ Access token expired, waiting for refresh");
          // Don't make API calls with expired tokens
          if (mounted) {
            setUser(null);
          }
        }
      } catch (error) {
        console.error("❌ Auth initialization error:", error);
        if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
    };
  }, [setLoading, setUser]);

  const login = useCallback(
    async (email: string, password: string): Promise<void> => {
      try {
        setLoading(true);
        setError(null);

        console.log("🔐 Attempting login for:", email);
        const user = await api.login({ email, password });

        console.log("✅ Login successful:", user.email);
        setUser(user);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Login failed";
        console.error("❌ Login failed:", errorMessage);
        setError(errorMessage);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError, setUser]
  );

  const register = useCallback(
    async (
      email: string,
      username: string,
      password: string,
      age?: number
    ): Promise<void> => {
      try {
        setLoading(true);
        setError(null);

        console.log("📝 Attempting registration for:", email);
        await api.register({ email, username, password, age });

        // Registration successful, now login
        console.log("✅ Registration successful, logging in...");
        const user = await api.login({ email, password });

        console.log("✅ Auto-login successful:", user.email);
        setUser(user);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Registration failed";
        console.error("❌ Registration failed:", errorMessage);
        setError(errorMessage);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError, setUser]
  );

  const logout = useCallback(async (): Promise<void> => {
    try {
      console.log("👋 Logging out user");
      await api.logout();
    } catch (error) {
      console.error("Logout error:", error);
      // Continue with logout even if API call fails
    } finally {
      console.log("🧹 Clearing user state");
      setUser(null);
    }
  }, [setUser]);

  const refreshUser = useCallback(async (): Promise<void> => {
    try {
      // Only attempt refresh if we think we're authenticated
      if (!state.isAuthenticated) {
        console.log("🚫 Cannot refresh user - not authenticated");
        return;
      }

      console.log("🔄 Refreshing user data");
      const user = await api.getCurrentUser();
      setUser(user);
    } catch (error) {
      console.error("Failed to refresh user:", error);
      // Don't immediately logout - let the user try to login again
      setError("Session may have expired. Please try logging in again.");
    }
  }, [state.isAuthenticated, setUser, setError]);

  const contextValue: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    clearError,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
