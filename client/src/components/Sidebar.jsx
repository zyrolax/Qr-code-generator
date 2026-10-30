import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth.jsx";
import Logo from "./Logo.jsx";

// Small inline stroke icons so we don't pull in an icon library.
const Icon = ({ d, className = "h-5 w-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
       strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    {d}
  </svg>
);
const icons = {
  dashboard: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /></>,
  claim: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
  generate: <><path d="M3 7h18" /><path d="M3 12h18" /><path d="M3 17h18" /></>,
  list: <><path d="M8 6h13" /><path d="M8 12h13" /><path d="M8 18h13" /><circle cx="3.5" cy="6" r="1" /><circle cx="3.5" cy="12" r="1" /><circle cx="3.5" cy="18" r="1" /></>,
  logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" /></>,
  external: <><path d="M14 3h7v7" /><path d="M10 14 21 3" /><path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" /></>,
};

// The content of the sidebar (shared by the desktop rail and the mobile drawer).
function SidebarContent({ onNavigate }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
      isActive ? "bg-brand text-white shadow-sm shadow-brand/30" : "text-gray-600 hover:bg-brand-light hover:text-brand"
    }`;

  async function handleLogout() {
    await logout();
    navigate("/");
  }

  return (
    <div className="flex h-full flex-col">
      <div className="px-4 py-5">
        <Logo />
      </div>

      <nav className="flex-1 space-y-1 px-3">
        <NavLink to="/dashboard" className={linkClass} onClick={onNavigate}>
          <Icon d={icons.dashboard} /> Dashboard
        </NavLink>
        <NavLink to="/claim" className={linkClass} onClick={onNavigate}>
          <Icon d={icons.claim} /> Claim a sticker
        </NavLink>

        {user?.role === "admin" && (
          <>
            <p className="px-3 pb-1 pt-4 text-xs font-semibold uppercase tracking-wide text-gray-400">
              Admin
            </p>
            <NavLink to="/admin/batch" className={linkClass} onClick={onNavigate}>
              <Icon d={icons.generate} /> Generate stickers
            </NavLink>
            <NavLink to="/admin/stickers" className={linkClass} onClick={onNavigate}>
              <Icon d={icons.list} /> All stickers
            </NavLink>
          </>
        )}
      </nav>

      {/* User + logout pinned to the bottom. */}
      <div className="border-t border-gray-200 p-3">
        <div className="mb-2 px-2">
          <p className="truncate text-sm font-medium text-gray-800">{user?.email}</p>
          <p className="text-xs capitalize text-gray-400">{user?.role}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-red-50 hover:text-red-600"
        >
          <Icon d={icons.logout} /> Log out
        </button>
      </div>
    </div>
  );
}

// Responsive sidebar: a fixed rail on desktop, a slide-in drawer on mobile.
export default function Sidebar({ open, onClose }) {
  return (
    <>
      {/* Desktop rail */}
      <aside className="hidden w-64 shrink-0 border-r border-gray-200 bg-white lg:block">
        <div className="sticky top-0 h-screen">
          <SidebarContent />
        </div>
      </aside>

      {/* Mobile drawer + backdrop */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={onClose} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-white shadow-xl">
            <SidebarContent onNavigate={onClose} />
          </aside>
        </div>
      )}
    </>
  );
}
