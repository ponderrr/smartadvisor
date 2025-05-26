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
    age?: number,
  ) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

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
        if (api.isAuthenticated) {
          const user = await api.getCurrentUser();
          if (mounted) {
            setUser(user);
          }
        }
      } catch (error) {
        console.error("Auth initialization failed:", error);
        // Clear potentially invalid tokens
        if (mounted) {
          await api.logout();
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
  }, []); // Remove setUser and setLoading from dependencies to prevent loops

  const login = useCallback(async (email: string, password: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const user = await api.login({ email, password });
      setUser(user);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Login failed";
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, setUser]);

  const register = useCallback(async (
    email: string,
    username: string,
    password: string,
    age?: number,
  ): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      await api.register({ email, username, password, age });

      // Auto-login after successful registration
      const user = await api.login({ email, password });
      setUser(user);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Registration failed";
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, setUser]);

  const logout = useCallback(async (): Promise<void> => {
    try {
      await api.logout();
    } catch (error) {
      console.error("Logout error:", error);
      // Continue with logout even if API call fails
    } finally {
      setUser(null);
    }
  }, [setUser]);

  const refreshUser = useCallback(async (): Promise<void> => {
    try {
      if (api.isAuthenticated) {
        const user = await api.getCurrentUser();
        setUser(user);
      }
    } catch (error) {
      console.error("Failed to refresh user:", error);
      setError("Session expired. Please log in again.");
      await logout();
    }
  }, [setUser, setError, logout]);

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