import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../lib/auth.jsx";
import { Button, Input, Alert } from "../components/ui.jsx";
import { FlameIcon } from "../components/Logo.jsx";

// The sliding "how it works" story. White text — always sits on a purple panel.
const SLIDES = [
  { emoji: "🏷️", title: "Stick it", desc: "Put a Requesto QR on the stuff you don't want to lose." },
  { emoji: "✅", title: "Claim it", desc: "Scan the card, enter your claim code, and it's yours." },
  { emoji: "📨", title: "Get it back", desc: "A finder scans and messages you — your number stays private." },
];

function HowItWorks() {
  const [i, setI] = useState(0);

  // Auto-advance every 4s.
  useEffect(() => {
    const t = setInterval(() => setI((p) => (p + 1) % SLIDES.length), 4000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="w-full">
      <div className="overflow-hidden">
        {/* Track slides horizontally and shift with translateX. */}
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${i * 100}%)` }}
        >
          {SLIDES.map((s) => (
            <div key={s.title} className="w-full shrink-0 px-1">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 text-3xl">
                {s.emoji}
              </div>
              <h3 className="text-2xl font-bold">{s.title}</h3>
              <p className="mt-1 max-w-xs text-white/80">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Dots */}
      <div className="mt-5 flex gap-2">
        {SLIDES.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setI(idx)}
            aria-label={`Slide ${idx + 1}`}
            className={`h-2 rounded-full transition-all ${
              idx === i ? "w-6 bg-white" : "w-2 bg-white/40"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

// Full-screen auth screen: sign in / create account, with the how-it-works
// slider. `mode` sets the initial tab (login or signup).
export default function Welcome({ mode: initialMode = "login" }) {
  const { login, signup, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState(initialMode);
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Already logged in? Skip straight to the app.
  useEffect(() => {
    if (user) navigate("/dashboard", { replace: true });
  }, [user, navigate]);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "signup") await signup(form.email, form.password);
      else await login(form.email, form.password);
      navigate(location.state?.from || "/dashboard", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-2">
      {/* Brand + story panel (desktop) */}
      <div className="relative hidden flex-col justify-between bg-gradient-to-br from-brand via-brand-dark to-[#2a1f8f] p-10 text-white lg:flex">
        <span className="inline-flex items-center gap-2">
          <FlameIcon className="h-8 w-8" />
          <span className="text-xl font-extrabold">Requesto</span>
        </span>

        <div>
          <h1 className="mb-8 text-4xl font-extrabold leading-tight">
            Lose it.<br />Get it back.
          </h1>
          <HowItWorks />
        </div>

        <p className="text-xs text-white/60">
          🔒 The owner's number is never shown to a finder.
        </p>
      </div>

      {/* Auth panel */}
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
        <div className="w-full max-w-sm">
          {/* Mobile brand + mini story (the purple panel is hidden on small screens) */}
          <div className="mb-6 rounded-2xl bg-gradient-to-br from-brand to-brand-dark p-5 text-white lg:hidden">
            <span className="mb-4 inline-flex items-center gap-2">
              <FlameIcon className="h-7 w-7" />
              <span className="text-lg font-extrabold">Requesto</span>
            </span>
            <HowItWorks />
          </div>

          <h2 className="text-2xl font-bold">
            {mode === "signup" ? "Create your account" : "Welcome back"}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {mode === "signup" ? "Start protecting your stuff." : "Log in to manage your stickers."}
          </p>

          {/* Tabs */}
          <div className="mt-5 flex rounded-xl bg-gray-100 p-1">
            {[
              { key: "login", label: "Log in" },
              { key: "signup", label: "Sign up" },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => {
                  setMode(t.key);
                  setError("");
                }}
                className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
                  mode === t.key ? "bg-white text-brand shadow-sm" : "text-gray-500"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="mt-4 space-y-3">
            <Input
              label="Email"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <Input
              label="Password"
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            {mode === "signup" && <p className="text-xs text-gray-500">At least 8 characters.</p>}
            {error && <Alert kind="error">{error}</Alert>}
            <Button type="submit" disabled={busy} className="w-full">
              {busy ? "Please wait…" : mode === "signup" ? "Create account" : "Log in"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
