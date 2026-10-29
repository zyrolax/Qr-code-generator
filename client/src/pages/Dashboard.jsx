import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import { Button, StatusBadge, Card, Alert } from "../components/ui.jsx";
import { publicUrl, useQr, copy } from "../lib/sticker.js";

const FILTERS = ["all", "active", "paused", "lost", "unclaimed"];

export default function Dashboard() {
  const [stickers, setStickers] = useState(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [busyId, setBusyId] = useState(null); // disables a card's buttons mid-request

  async function load() {
    try {
      const { stickers } = await api.get("/stickers");
      setStickers(stickers);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // Summary numbers shown across the top.
  const stats = useMemo(() => {
    const list = stickers || [];
    return {
      total: list.length,
      active: list.filter((s) => s.status === "active").length,
      lost: list.filter((s) => s.status === "lost").length,
      scans: list.reduce((sum, s) => sum + (s.scanCount || 0), 0),
      unread: list.reduce((sum, s) => sum + (s.unreadCount || 0), 0),
    };
  }, [stickers]);

  const visible = useMemo(() => {
    if (!stickers) return [];
    return filter === "all" ? stickers : stickers.filter((s) => s.status === filter);
  }, [stickers, filter]);

  async function run(id, fn) {
    setBusyId(id);
    try {
      await fn();
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  const toggleStatus = (s) =>
    run(s._id, () =>
      api.patch(`/stickers/${s._id}/status`, {
        status: s.status === "paused" ? "active" : "paused",
      })
    );

  const toggleLost = (s) =>
    run(s._id, () => api.patch(`/stickers/${s._id}/lost`, { lost: s.status !== "lost" }));

  if (error) return <Wrap><Alert kind="error">{error}</Alert></Wrap>;
  if (!stickers) return <Wrap><p className="text-gray-500">Loading…</p></Wrap>;

  return (
    <Wrap>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">My stickers</h1>
        <Button as="link" to="/claim">
          + Claim a sticker
        </Button>
      </div>

      {/* Summary stats */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Stickers" value={stats.total} />
        <Stat label="Active" value={stats.active} accent="green" />
        <Stat label="In lost mode" value={stats.lost} accent="red" />
        <Stat label="Total scans" value={stats.scans} />
      </div>

      {stats.unread > 0 && (
        <div className="mb-5">
          <Alert kind="info">
            You have <strong>{stats.unread}</strong> unread finder message
            {stats.unread > 1 ? "s" : ""}.
          </Alert>
        </div>
      )}

      {/* Status filter */}
      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const n = f === "all" ? stickers.length : stickers.filter((s) => s.status === f).length;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-3 py-1 text-sm capitalize transition ${
                filter === f ? "bg-brand text-white" : "bg-white text-gray-600 hover:bg-gray-100"
              }`}
            >
              {f} <span className="opacity-70">({n})</span>
            </button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <Card className="text-center">
          <p className="text-gray-600">
            {stickers.length === 0
              ? "You haven’t claimed any stickers yet."
              : `No ${filter} stickers.`}
          </p>
          {stickers.length === 0 && (
            <Button as="link" to="/claim" className="mt-3">
              Claim your first sticker
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-3">
          {visible.map((s) => (
            <StickerCard
              key={s._id}
              s={s}
              busy={busyId === s._id}
              onToggleStatus={() => toggleStatus(s)}
              onToggleLost={() => toggleLost(s)}
            />
          ))}
        </div>
      )}
    </Wrap>
  );
}

function StickerCard({ s, busy, onToggleStatus, onToggleLost }) {
  const qr = useQr(s.code, 96);
  const url = publicUrl(s.code);
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    if (await copy(url)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }

  return (
    <Card className={busy ? "opacity-60" : ""}>
      <div className="flex gap-4">
        {/* QR thumbnail */}
        {qr ? (
          <img src={qr} alt="" className="hidden h-20 w-20 rounded-lg sm:block" />
        ) : (
          <div className="hidden h-20 w-20 rounded-lg bg-gray-100 sm:block" />
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-semibold">{s.page?.title || "Untitled page"}</h2>
            <StatusBadge status={s.status} />
            {s.unreadCount > 0 && (
              <span className="rounded-full bg-brand px-2 py-0.5 text-xs font-semibold text-white">
                {s.unreadCount} new
              </span>
            )}
          </div>

          <p className="mt-1 text-sm text-gray-500">
            {s.scanCount} scans · {s.messageCount} message{s.messageCount === 1 ? "" : "s"} ·
            updated {new Date(s.updatedAt).toLocaleDateString()}
          </p>

          {/* Public link with copy + open */}
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            <code className="rounded bg-gray-100 px-2 py-0.5 text-gray-700">/q/{s.code}</code>
            <button onClick={copyLink} className="font-medium text-brand hover:underline">
              {copied ? "Copied!" : "Copy link"}
            </button>
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-brand hover:underline"
            >
              Open
            </a>
          </div>

          {/* Actions */}
          <div className="mt-3 flex flex-wrap gap-2">
            <Button as="link" to={`/dashboard/stickers/${s._id}/edit`} variant="outline">
              Edit page
            </Button>
            <Button as="link" to={`/dashboard/stickers/${s._id}/messages`} variant="outline">
              Messages{s.unreadCount > 0 ? ` (${s.unreadCount})` : ""}
            </Button>
            {s.status !== "lost" && s.status !== "unclaimed" && (
              <Button variant="secondary" disabled={busy} onClick={onToggleStatus}>
                {s.status === "paused" ? "Resume" : "Pause"}
              </Button>
            )}
            {s.status !== "unclaimed" && (
              <Button
                variant={s.status === "lost" ? "outline" : "danger"}
                disabled={busy}
                onClick={onToggleLost}
              >
                {s.status === "lost" ? "Mark found" : "Lost mode"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

function Stat({ label, value, accent }) {
  const color =
    accent === "green" ? "text-green-600" : accent === "red" ? "text-red-600" : "text-gray-900";
  return (
    <Card className="py-4">
      <p className={`text-2xl font-extrabold ${color}`}>{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </Card>
  );
}

function Wrap({ children }) {
  return <main className="mx-auto max-w-3xl px-4 py-8">{children}</main>;
}
