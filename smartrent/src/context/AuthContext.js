import { createContext, useContext, useEffect, useState } from "react";
import { api, getToken, setToken } from "../api/client";

function decodeRole(token) {
  try {
    return JSON.parse(atob(token.split(".")[1])).role;
  } catch {
    return null;
  }
}

function normalize(profile, role) {
  return { ...profile, role, fullName: profile.name };
}

const PROFILE_PATH = { landlord: "/landlord/profile", secretary: "/secretary/profile", tenant: "/tenant/profile" };
const LOGIN_PATH = {
  landlord: "/auth/landlord/login",
  secretary: "/auth/secretary/login",
  tenant: "/auth/tenant/login",
};
const CHANGE_PASSWORD_PATH = {
  landlord: "/auth/landlord/change-password",
  secretary: "/auth/secretary/change-password",
  tenant: "/auth/tenant/change-password",
};
const ACCEPT_INVITE_PATH = { secretary: "/auth/secretary/accept-invite", tenant: "/auth/tenant/accept-invite" };

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function restoreSession() {
      const token = getToken();
      if (!token) {
        setReady(true);
        return;
      }
      const role = decodeRole(token);
      const path = PROFILE_PATH[role];
      if (!path) {
        setToken(null);
        setReady(true);
        return;
      }
      try {
        const { data } = await api.get(path);
        setUser(normalize(data, role));
      } catch {
        setToken(null);
      }
      setReady(true);
    }
    restoreSession();
  }, []);

  async function login(email, password, role) {
    try {
      const { data } = await api.post(LOGIN_PATH[role], { email, password });
      setToken(data.token);
      const profile = normalize(data[role], role);
      setUser(profile);
      return { ok: true, user: profile };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }

  async function registerLandlord({ fullName, email, phone, password }) {
    try {
      const { data } = await api.post("/auth/landlord/signup", { name: fullName, email, phone, password });
      setToken(data.token);
      const profile = normalize(data.landlord, "landlord");
      setUser(profile);
      return { ok: true, user: profile };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }

  async function acceptInvite(role, { token: inviteToken, password }) {
    try {
      const { data } = await api.post(ACCEPT_INVITE_PATH[role], { token: inviteToken, password });
      setToken(data.token);
      const profile = normalize(data[role], role);
      setUser(profile);
      return { ok: true, user: profile };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }

  function logout() {
    setToken(null);
    setUser(null);
  }

  async function updateProfile(updates) {
    try {
      const body = user.role === "landlord" ? { name: updates.fullName, phone: updates.phone } : { phone: updates.phone };
      const { data } = await api.put(PROFILE_PATH[user.role], body);
      setUser(normalize(data, user.role));
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }

  async function changePassword(currentPassword, newPassword) {
    try {
      await api.post(CHANGE_PASSWORD_PATH[user.role], { currentPassword, newPassword });
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }

  const isStaff = user?.role === "landlord" || user?.role === "secretary";

  return (
    <AuthContext.Provider
      value={{
        user,
        ready,
        isStaff,
        login,
        registerLandlord,
        acceptInvite,
        logout,
        updateProfile,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
