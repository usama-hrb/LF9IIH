/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { me, login, loadDoctorProfile, saveDoctorProfile } from "./auth";
import { Navigate, Outlet, useLocation } from "react-router-dom";

const AuthContext = createContext({
  user: null,
  loading: true,
  setUser: () => {},
  refresh: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => loadDoctorProfile());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const saved = loadDoctorProfile();
      if (saved) setUser((prev) => prev || saved);
      try {
        const u = await me();
        if (!mounted) return;
        setUser(u);
        saveDoctorProfile(u);
      } catch {
        // Try to re-login silently using saved code to re-establish cookie
        if (saved?.code) {
          try {
            await login({ code: String(saved.code) });
            const u2 = await me();
            if (!mounted) return;
            setUser(u2);
            saveDoctorProfile(u2);
          } catch {
            // Keep using saved profile to avoid redirecting on refresh
            if (!mounted) return;
            setUser((prev) => prev || saved);
          }
        } else {
          if (!mounted) return;
          setUser(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const refresh = async () => {
    setLoading(true);
    try {
      const u = await me();
      setUser(u);
      saveDoctorProfile(u);
      return u;
    } finally {
      setLoading(false);
    }
  };

  const value = useMemo(
    () => ({ user, setUser, loading, refresh }),
    [user, loading]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

function LoadingScreen() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6">
      <div className="text-gray-600">جارٍ التحقق من الجلسة...</div>
    </div>
  );
}

export function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <LoadingScreen />;
  if (!user)
    return <Navigate to="/teacher/login" replace state={{ from: location }} />;
  return <Outlet />;
}

export function PublicOnlyRoute() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (user) return <Navigate to="/teacher/dashboard" replace />;
  return <Outlet />;
}
