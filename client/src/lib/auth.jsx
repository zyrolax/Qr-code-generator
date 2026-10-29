import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../api.js";

// Holds the current user (or null) and auth actions. On mount it asks the
// server who we are via the cookie, so a page refresh keeps you logged in.
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/auth/me")
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const value = {
    user,
    loading,
    async login(email, password) {
      const data = await api.post("/auth/login", { email, password });
      setUser(data.user);
      return data.user;
    },
    async signup(email, password) {
      const data = await api.post("/auth/signup", { email, password });
      setUser(data.user);
      return data.user;
    },
    async logout() {
      await api.post("/auth/logout");
      setUser(null);
    },
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
