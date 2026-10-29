import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { api } from "../api.js";
import { Button, Input, Alert, Card } from "../components/ui.jsx";

export default function Claim() {
  const navigate = useNavigate();
  const location = useLocation();
  // The landing-page claim box can prefill a code via router state.
  const [claimCode, setClaimCode] = useState(location.state?.prefill || "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const { sticker } = await api.post("/stickers/claim", { claimCode });
      // Go straight to editing the newly-claimed sticker's page.
      navigate(`/dashboard/stickers/${sticker._id}/edit`, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <Card>
        <h1 className="text-2xl font-bold">Claim a sticker</h1>
        <p className="mt-1 text-sm text-gray-600">
          Enter the claim code from the card that came with your sticker.
        </p>
        <form onSubmit={submit} className="mt-4 space-y-3">
          <Input
            label="Claim code"
            value={claimCode}
            onChange={(e) => setClaimCode(e.target.value)}
            placeholder="RQ-XXXX-XXXX"
            className="uppercase"
            required
          />
          {error && <Alert kind="error">{error}</Alert>}
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? "Claiming…" : "Claim sticker"}
          </Button>
        </form>
      </Card>
    </main>
  );
}
