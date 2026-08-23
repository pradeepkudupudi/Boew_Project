import { createContext, useContext, useEffect, useState } from "react";
import { useGetMe, getGetMeQueryKey, setAuthTokenGetter } from "@workspace/api-client-react";
import type { User } from "@workspace/api-client-react";
import { resolveApiUrl } from "@/lib/api-config";

interface AuthContextType {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Setup token getter for generated query client
setAuthTokenGetter(() => localStorage.getItem("boew_token"));

// Patch fetch to automatically resolve API URL and attach the auth token
const originalFetch = window.fetch;
window.fetch = async (input, init) => {
  let resolvedInput = input;
  if (typeof input === "string" && input.startsWith("/")) {
    resolvedInput = resolveApiUrl(input);
  } else if (typeof Request !== "undefined" && input instanceof Request && input.url.startsWith("/")) {
    resolvedInput = new Request(resolveApiUrl(input.url), input);
  }

  const token = localStorage.getItem("boew_token");
  if (token) {
    init = init || {};
    if (init.headers instanceof Headers) {
      if (!init.headers.has("Authorization")) {
        init.headers.set("Authorization", `Bearer ${token}`);
      }
    } else if (Array.isArray(init.headers)) {
      init.headers = [...init.headers, ["Authorization", `Bearer ${token}`]];
    } else {
      init.headers = {
        ...(init.headers || {}),
        Authorization: `Bearer ${token}`,
      };
    }
  }
  return originalFetch(resolvedInput, init);
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
    // If token present but user fetch returned nothing
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
