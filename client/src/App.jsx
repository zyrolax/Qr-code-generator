import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./lib/auth.jsx";
import Nav from "./components/Nav.jsx";

import Landing from "./pages/Landing.jsx";
import Scan from "./pages/Scan.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import Claim from "./pages/Claim.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Editor from "./pages/Editor.jsx";
import Inbox from "./pages/Inbox.jsx";
import AdminBatch from "./pages/admin/Batch.jsx";
import AdminStickers from "./pages/admin/Stickers.jsx";

// Gate for owner-only pages. While we're still checking the cookie we show
// nothing; once known, redirect to login if not authenticated.
function RequireAuth({ children, adminOnly = false }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="p-8 text-center text-gray-500">Loading…</div>;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (adminOnly && user.role !== "admin") return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  const location = useLocation();
  // The public scan page is intentionally chrome-free (it's what a finder sees).
  const hideNav = location.pathname.startsWith("/q/");

  return (
    <div className="min-h-screen bg-gray-50">
      {!hideNav && <Nav />}
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/q/:code" element={<Scan />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route
          path="/claim"
          element={
            <RequireAuth>
              <Claim />
            </RequireAuth>
          }
        />
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <Dashboard />
            </RequireAuth>
          }
        />
        <Route
          path="/dashboard/stickers/:id/edit"
          element={
            <RequireAuth>
              <Editor />
            </RequireAuth>
          }
        />
        <Route
          path="/dashboard/stickers/:id/messages"
          element={
            <RequireAuth>
              <Inbox />
            </RequireAuth>
          }
        />

        <Route
          path="/admin/batch"
          element={
            <RequireAuth adminOnly>
              <AdminBatch />
            </RequireAuth>
          }
        />
        <Route
          path="/admin/stickers"
          element={
            <RequireAuth adminOnly>
              <AdminStickers />
            </RequireAuth>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
