import { createContext, useContext, useEffect, useState } from "react";
import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import type { User } from "@workspace/api-client-react";

interface AuthContextType {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Patch fetch to automatically attach the token
const originalFetch = window.fetch;
window.fetch = async (input, init) => {
  const token = localStorage.getItem("boew_token");
  if (token) {
    init = init || {};
    init.headers = {
      ...init.headers,
      Authorization: `Bearer ${token}`,
    };
  }
  return originalFetch(input, init);
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem("boew_token"));

  const { data: user, isLoading } = useGetMe({
    query: {
      enabled: !!token,
      retry: false,
      queryKey: getGetMeQueryKey(),
    },
  });

  const login = (newToken: string) => {
    localStorage.setItem("boew_token", newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem("boew_token");
    setToken(null);
  };

  useEffect(() => {
    // If token present but user fetch returned nothing (silently handle)
  }, [token, isLoading, user]);

  return (
    <AuthContext.Provider value={{ token, user: user || null, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
