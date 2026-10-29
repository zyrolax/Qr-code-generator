import { useEffect, useState } from "react";
import { api } from "../../api.js";
import { Button, StatusBadge, Card, Alert } from "../../components/ui.jsx";

// Admin: a flat list of every sticker and its status.
export default function Stickers() {
  const [stickers, setStickers] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/admin/stickers")
      .then(({ stickers }) => setStickers(stickers))
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <Wrap><Alert kind="error">{error}</Alert></Wrap>;
  if (!stickers) return <Wrap><p className="text-gray-500">Loading…</p></Wrap>;

  return (
    <Wrap>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-bold">All stickers ({stickers.length})</h1>
        <Button as="link" to="/admin/batch">
          + Generate
        </Button>
      </div>

      {stickers.length === 0 ? (
        <Card className="text-center text-gray-600">
          No stickers yet. Generate a batch to get started.
        </Card>
      ) : (
      <Card className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-gray-500">
            <tr>
              <th className="py-2 pr-4">Code</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 pr-4">Owner</th>
              <th className="py-2 pr-4">Scans</th>
              <th className="py-2">Created</th>
            </tr>
          </thead>
          <tbody>
            {stickers.map((s) => (
              <tr key={s._id} className="border-t border-gray-100">
                <td className="py-2 pr-4 font-mono">{s.code}</td>
                <td className="py-2 pr-4"><StatusBadge status={s.status} /></td>
                <td className="py-2 pr-4 text-gray-600">{s.owner?.email || "—"}</td>
                <td className="py-2 pr-4">{s.scanCount}</td>
                <td className="py-2 text-gray-500">
                  {new Date(s.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      )}
    </Wrap>
  );
}

function Wrap({ children }) {
  return <main className="mx-auto max-w-4xl px-4 py-8">{children}</main>;
}
