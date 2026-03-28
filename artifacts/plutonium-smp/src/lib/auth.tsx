import { createContext, useContext, ReactNode, useState, useEffect } from "react";
import { User, useGetMe } from "@workspace/api-client-react";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string) => void;
  logout: () => void;
  refetchUser: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem("plutonium_token"));
  
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
    setToken(newToken);
    setTimeout(() => refetch(), 50); // small delay to ensure token is picked up
  };

  const logout = () => {
    setToken(null);
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
