import { useState } from "react";
import { Outlet, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../lib/auth.jsx";
import Sidebar from "./Sidebar.jsx";
import Logo from "./Logo.jsx";

// Authenticated app shell: sidebar on desktop, a slide-in drawer on mobile
// with a slim top bar to open it. Also enforces that the user is logged in.
export function AuthedLayout() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading…</div>;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;

  return (
    <div className="min-h-screen bg-gray-50 lg:flex">
      <Sidebar open={open} onClose={() => setOpen(false)} />

      <div className="min-w-0 flex-1">
        {/* Mobile top bar (hidden on desktop where the rail is always visible) */}
        <div className="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 lg:hidden">
          <button
            onClick={() => setOpen(true)}
            className="rounded-lg p-1.5 text-gray-600 hover:bg-gray-100"
            aria-label="Open menu"
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
            </svg>
          </button>
          <Logo />
        </div>

        <Outlet />
      </div>
    </div>
  );
}

// Guard for admin-only routes (used as a layout route inside AuthedLayout).
export function RequireAdmin() {
  const { user } = useAuth();
  if (user?.role !== "admin") return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
