import { useState } from "react";
import { api } from "../../api.js";
import { Button, Input, Alert, Card } from "../../components/ui.jsx";

// Admin: generate a batch, then download the CSV and printable PDFs. The main
// print output is the customisable "labels" sheet (logo + scan-me + QR, with a
// tear-off claim-code stub below).
export default function Batch() {
  const [count, setCount] = useState(5);
  const [batch, setBatch] = useState(null); // { batchId, items } — held in memory
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Print customisation for the labels PDF.
  const [opts, setOpts] = useState({
    size: "medium",
    topText: "FOUND ME? SCAN ME",
    showLogo: true,
    showClaim: true,
    accent: "#5B4BF5",
  });

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

  function downloadCsv() {
    const header = "code,claim_code,url\n";
    const rows = batch.items.map((i) => `${i.code},${i.claimCode},${i.url}`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    triggerDownload(blob, `requesto-batch-${batch.batchId}.csv`);
  }

  // POST the in-memory items (claim codes only exist here) + chosen options.
  async function downloadPdf(path, body, filename) {
    const res = await fetch(path, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      setError("Could not generate the PDF.");
      return;
    }
    triggerDownload(await res.blob(), filename);
  }

  const setOpt = (patch) => setOpts((o) => ({ ...o, ...patch }));

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
          {/* Print customisation */}
          <Card className="mt-5">
            <h2 className="font-semibold">Print layout</h2>
            <p className="mt-1 text-sm text-gray-600">
              Customise the printable labels, then download the PDF.
            </p>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {/* Size */}
              <div>
                <span className="mb-1 block text-sm font-medium text-gray-700">Sticker size</span>
                <div className="flex gap-2">
                  {[
                    { key: "small", label: "Small", hint: "1.8cm · 4-up" },
                    { key: "medium", label: "Medium", hint: "2.5cm · 3-up" },
                    { key: "large", label: "Large", hint: "3.5cm · 2-up" },
                  ].map((s) => (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => setOpt({ size: s.key })}
                      className={`flex-1 rounded-xl border px-2 py-2 text-xs ${
                        opts.size === s.key
                          ? "border-brand bg-brand-light text-brand"
                          : "border-gray-300 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <span className="block font-semibold">{s.label}</span>
                      <span className="block opacity-70">{s.hint}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Accent colour */}
              <div>
                <span className="mb-1 block text-sm font-medium text-gray-700">Brand colour</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={opts.accent}
                    onChange={(e) => setOpt({ accent: e.target.value })}
                    className="h-10 w-12 cursor-pointer rounded-lg border border-gray-300"
                  />
                  <span className="text-sm text-gray-500">{opts.accent}</span>
                </div>
              </div>

              {/* Top text */}
              <div className="sm:col-span-2">
                <Input
                  label="Top line (above the QR)"
                  value={opts.topText}
                  maxLength={40}
                  onChange={(e) => setOpt({ topText: e.target.value })}
                />
              </div>

              {/* Toggles */}
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={opts.showLogo}
                  onChange={(e) => setOpt({ showLogo: e.target.checked })}
                />
                Show Requesto logo
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={opts.showClaim}
                  onChange={(e) => setOpt({ showClaim: e.target.checked })}
                />
                Include tear-off claim code
              </label>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                onClick={() =>
                  downloadPdf(
                    "/api/admin/stickers/batch/print.pdf",
                    { items: batch.items, options: opts },
                    "requesto-labels.pdf"
                  )
                }
              >
                Download labels (PDF)
              </Button>
              <Button variant="secondary" onClick={downloadCsv}>
                Download CSV
              </Button>
              <a
                href={`/api/admin/stickers/batch/${batch.batchId}/stickers.pdf`}
                className="inline-flex items-center justify-center rounded-xl border border-gray-300 px-4 py-2.5 font-medium text-gray-700 hover:bg-gray-50"
              >
                QR-only sheet
              </a>
              <Button
                variant="outline"
                onClick={() =>
                  downloadPdf(
                    "/api/admin/stickers/batch/cards.pdf",
                    { items: batch.items },
                    "requesto-claim-cards.pdf"
                  )
                }
              >
                Separate claim cards
              </Button>
            </div>
          </Card>

          <Card className="mt-4">
            <h2 className="font-semibold">Batch created 🎉</h2>
            <p className="mt-1 text-sm text-gray-600">
              Save these now — the claim codes are shown only once.
            </p>
            <div className="mt-3 overflow-x-auto">
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
            </div>
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
