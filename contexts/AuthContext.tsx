"use client";
import { createContext, useContext, useState, ReactNode } from "react";

type User = {
  name: string;
  role: string;
};

type Credentials = {
  email: string;
  password: string;
};

type AuthContextType = {
  user: User | null;
  login: (credentials: Credentials) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);

  const login = (credentials: Credentials) => {
    setUser({ name: credentials.email, role: "manager" });
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
