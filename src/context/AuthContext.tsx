import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
} from "react";

interface User {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  vehicle_number: string | null;
  role: "OWNER" | "DRIVER";
  is_active: boolean;
  must_change_password: boolean;
}

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {

  const [user, setUser] = useState<User | null>(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {

  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}