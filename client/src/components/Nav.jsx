import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth.jsx";
import { Button } from "./ui.jsx";

// Top navigation. Shows different links depending on login + role.
export default function Nav() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/");
  }

  return (
    <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-3">
        <Link to="/" className="text-lg font-bold text-brand">
          Requesto
        </Link>
        <nav className="flex flex-wrap items-center gap-2">
          {user ? (
            <>
              <Button as="link" to="/dashboard" variant="outline">
                Dashboard
              </Button>
              {user.role === "admin" && (
                <Button as="link" to="/admin/stickers" variant="outline">
                  Admin
                </Button>
              )}
              <Button variant="secondary" onClick={handleLogout}>
                Log out
              </Button>
            </>
          ) : (
            <>
              <Button as="link" to="/login" variant="outline">
                Log in
              </Button>
              <Button as="link" to="/signup">
                Sign up
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
