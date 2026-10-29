import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api.js";
import { Button, Input, Alert, Card } from "../../components/ui.jsx";

// Admin: generate a batch of stickers, then download the CSV, the printable
// QR sticker sheet, and the separate claim-code cards.
export default function Batch() {
  const [count, setCount] = useState(5);
  const [batch, setBatch] = useState(null); // { batchId, items } — held in memory
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function generate(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const data = await api.post("/admin/stickers/batch", { count: Number(count) });
      setBatch(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  // CSV is built client-side from the in-memory batch (claim codes only exist
  // here, right after creation — the server can't regenerate them).
  function downloadCsv() {
    const header = "code,claim_code,url\n";
    const rows = batch.items.map((i) => `${i.code},${i.claimCode},${i.url}`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    triggerDownload(blob, `requesto-batch-${batch.batchId}.csv`);
  }

  // Claim-cards PDF: POST the in-memory items back so the server can render it.
  async function downloadCards() {
    const res = await fetch("/api/admin/stickers/batch/cards.pdf", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: batch.items }),
    });
    const blob = await res.blob();
    triggerDownload(blob, "requesto-claim-cards.pdf");
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Generate stickers</h1>
        <Button as="link" to="/admin/stickers" variant="outline">
          All stickers
        </Button>
      </div>

      <Card>
        <form onSubmit={generate} className="flex items-end gap-3">
          <div className="flex-1">
            <Input
              label="How many stickers?"
              type="number"
              min={1}
              max={500}
              value={count}
              onChange={(e) => setCount(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={busy}>
            {busy ? "Generating…" : "Generate"}
          </Button>
        </form>
        {error && <div className="mt-3"><Alert kind="error">{error}</Alert></div>}
      </Card>

      {batch && (
        <>
          <Card className="mt-5">
            <h2 className="font-semibold">Batch created 🎉</h2>
            <p className="mt-1 text-sm text-gray-600">
              Save these now — the claim codes are shown only once.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button onClick={downloadCsv} variant="secondary">
                Download CSV
              </Button>
              <a
                href={`/api/admin/stickers/batch/${batch.batchId}/stickers.pdf`}
                className="inline-flex items-center justify-center rounded-xl bg-brand px-4 py-2.5 font-medium text-white hover:bg-brand-dark"
              >
                Download sticker sheet (PDF)
              </a>
              <Button onClick={downloadCards} variant="secondary">
                Download claim-code cards (PDF)
              </Button>
            </div>
          </Card>

          <Card className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-gray-500">
                <tr>
                  <th className="py-1 pr-4">Code</th>
                  <th className="py-1 pr-4">Claim code</th>
                  <th className="py-1">URL</th>
                </tr>
              </thead>
              <tbody>
                {batch.items.map((i) => (
                  <tr key={i.code} className="border-t border-gray-100">
                    <td className="py-1 pr-4 font-mono">{i.code}</td>
                    <td className="py-1 pr-4 font-mono">{i.claimCode}</td>
                    <td className="py-1 text-gray-500">{i.url}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}
    </main>
  );
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
