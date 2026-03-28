import { createContext, useContext, ReactNode, useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { User, useGetMe, setAuthTokenGetter } from "@workspace/api-client-react";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string) => void;
  logout: () => void;
  refetchUser: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Set up the auth token getter so all API requests send Authorization header
setAuthTokenGetter(() => localStorage.getItem("plutonium_token"));

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem("plutonium_token"));
  const queryClient = useQueryClient();

  const { data: user, isLoading, refetch } = useGetMe({
    query: {
      enabled: !!token,
      retry: false,
    }
  });

  useEffect(() => {
    if (token) {
      localStorage.setItem("plutonium_token", token);
    } else {
      localStorage.removeItem("plutonium_token");
    }
  }, [token]);

  const login = (newToken: string) => {
    localStorage.setItem("plutonium_token", newToken);
    setToken(newToken);
    refetch();
  };

  const logout = () => {
    localStorage.removeItem("plutonium_token");
    setToken(null);
    queryClient.clear();
  };

  return (
    <AuthContext.Provider value={{ user: user || null, token, isLoading, login, logout, refetchUser: refetch }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
