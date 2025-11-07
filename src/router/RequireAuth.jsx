// RequireAuth.jsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import useAuthUser from "@/hooks/useAuthUser";

export default function RequireAuth({ children }) {
  const { user, loading } = useAuthUser();
  const location = useLocation();

  if (loading) {
    return (
      <div className="grid place-items-center min-h-[calc(100vh-56px)] text-sm text-muted-foreground">
        Checking session…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // ✅ important: return children when logged in
  return children;
}
