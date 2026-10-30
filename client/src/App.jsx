import { Routes, Route, Navigate } from "react-router-dom";
import { PublicLayout, AuthedLayout, RequireAdmin } from "./components/layouts.jsx";

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

export default function App() {
  return (
    <Routes>
      {/* Public scan page — intentionally chrome-free (what a finder sees). */}
      <Route path="/q/:code" element={<Scan />} />

      {/* Public pages share a simple top nav. */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
      </Route>

      {/* Authenticated app — sidebar shell + login guard. */}
      <Route element={<AuthedLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/claim" element={<Claim />} />
        <Route path="/dashboard/stickers/:id/edit" element={<Editor />} />
        <Route path="/dashboard/stickers/:id/messages" element={<Inbox />} />

        {/* Admin-only area. */}
        <Route element={<RequireAdmin />}>
          <Route path="/admin/batch" element={<AdminBatch />} />
          <Route path="/admin/stickers" element={<AdminStickers />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
