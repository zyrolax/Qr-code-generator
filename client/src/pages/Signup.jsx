import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../lib/auth.jsx";
import { Button, Input, Alert, Card } from "../components/ui.jsx";

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await signup(form.email, form.password);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <Card>
        <h1 className="text-2xl font-bold">Create your account</h1>
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
          <p className="text-xs text-gray-500">At least 8 characters.</p>
          {error && <Alert kind="error">{error}</Alert>}
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? "Creating…" : "Sign up"}
          </Button>
        </form>
        <p className="mt-4 text-sm text-gray-600">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-brand">
            Log in
          </Link>
        </p>
      </Card>
    </main>
  );
}
