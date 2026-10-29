import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api.js";
import { Button, Alert, Card, StatusBadge } from "../components/ui.jsx";
import { publicUrl, useQr, copy } from "../lib/sticker.js";
import { BLOCK_TYPES, BLOCK_GROUPS, BLOCK_META, newBlock } from "../blocks/registry.js";
import { BlockFields } from "../blocks/BlockFields.jsx";
import { BlockList } from "../blocks/BlockView.jsx";

// Block-based page editor with a phone-framed live preview.
export default function Editor() {
  const { id } = useParams();
  const [sticker, setSticker] = useState(null);
  const [template, setTemplate] = useState("lost_found");
  const [blocks, setBlocks] = useState([]);
  const [saved, setSaved] = useState(null); // last-saved snapshot, to detect changes
  const [status, setStatus] = useState({});

  useEffect(() => {
    api
      .get(`/stickers/${id}`)
      .then(({ sticker }) => {
        setSticker(sticker);
        setTemplate(sticker.template);
        const initial = sticker.page?.blocks?.length
          ? sticker.page.blocks
          : migrateLegacy(sticker); // turn old fixed fields into blocks
        setBlocks(initial);
        setSaved(JSON.stringify({ template: sticker.template, blocks: initial }));
      })
      .catch((err) => setStatus({ error: err.message }));
  }, [id]);

  const current = useMemo(() => JSON.stringify({ template, blocks }), [template, blocks]);
  const dirty = saved !== null && current !== saved;

  // Warn before leaving with unsaved edits.
  useEffect(() => {
    function beforeUnload(e) {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    }
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [dirty]);

  // --- block operations ----------------------------------------------------
  const addBlock = (type) => setBlocks((b) => [...b, newBlock(type)]);
  const removeBlock = (i) => setBlocks((b) => b.filter((_, idx) => idx !== i));
  const updateProps = (i, props) =>
    setBlocks((b) => b.map((blk, idx) => (idx === i ? { ...blk, props } : blk)));
  const move = (i, dir) =>
    setBlocks((b) => {
      const j = i + dir;
      if (j < 0 || j >= b.length) return b;
      const next = [...b];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  async function save(e) {
    e.preventDefault();
    setStatus({ saving: true });
    try {
      const { sticker } = await api.put(`/stickers/${id}/page`, { template, blocks });
      setSticker(sticker);
      setSaved(JSON.stringify({ template, blocks }));
      setStatus({ saved: true });
      setTimeout(() => setStatus((s) => (s.saved ? {} : s)), 2500);
    } catch (err) {
      setStatus({ error: err.message });
    }
  }

  if (status.error && !sticker) return <Wrap><Alert kind="error">{status.error}</Alert></Wrap>;
  if (!sticker) return <Wrap><p className="text-gray-500">Loading…</p></Wrap>;

  return (
    <Wrap>
      <EditorHeader sticker={sticker} dirty={dirty} />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Builder */}
        <form onSubmit={save} className="space-y-4">
          <Card className="space-y-3">
            <span className="block text-sm font-medium text-gray-700">Template</span>
            <div className="flex gap-2">
              {["lost_found", "links"].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTemplate(t)}
                  className={`flex-1 rounded-xl border px-3 py-2 text-sm ${
                    template === t
                      ? "border-brand bg-brand-light text-brand"
                      : "border-gray-300 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {t === "lost_found" ? "Lost & found" : "Links"}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400">
              The template is a starting point — you can add any blocks below regardless.
            </p>
          </Card>

          {/* Block list */}
          {blocks.length === 0 ? (
            <Card className="text-center text-gray-500">
              No blocks yet. Add one from the palette below.
            </Card>
          ) : (
            blocks.map((block, i) => (
              <BlockEditorCard
                key={block.id}
                block={block}
                index={i}
                total={blocks.length}
                onUp={() => move(i, -1)}
                onDown={() => move(i, 1)}
                onRemove={() => removeBlock(i)}
                onChange={(props) => updateProps(i, props)}
              />
            ))
          )}

          <Palette onAdd={addBlock} />

          {status.error && <Alert kind="error">{status.error}</Alert>}

          {/* Sticky save bar */}
          <div className="sticky bottom-0 -mx-4 flex items-center gap-3 border-t border-gray-200 bg-gray-50 px-4 py-3">
            <Button type="submit" disabled={status.saving || !dirty}>
              {status.saving ? "Saving…" : dirty ? "Save changes" : "Saved"}
            </Button>
            {dirty && <span className="text-sm text-amber-600">Unsaved changes</span>}
            {status.saved && !dirty && <span className="text-sm text-green-600">✓ Saved</span>}
          </div>
        </form>

        {/* Live preview */}
        <div className="lg:sticky lg:top-20 lg:self-start">
          <p className="mb-2 text-sm font-medium text-gray-500">Live preview</p>
          <PhoneFrame>
            {sticker.status === "lost" && (
              <div className="mb-3 rounded-lg bg-red-600 px-3 py-2 text-center text-sm font-semibold text-white">
                🔴 This item is reported lost
              </div>
            )}
            {sticker.status === "paused" && (
              <div className="mb-3 rounded-lg bg-yellow-100 px-3 py-2 text-center text-xs text-yellow-700">
                Paused — finders currently see a “not active” message
              </div>
            )}
            {blocks.length === 0 ? (
              <p className="py-12 text-center text-sm text-gray-400">Your page is empty.</p>
            ) : (
              <BlockList blocks={blocks} interactive={false} />
            )}
          </PhoneFrame>
        </div>
      </div>
    </Wrap>
  );
}

// One editable block: header (icon, label, reorder/remove) + its fields.
function BlockEditorCard({ block, index, total, onUp, onDown, onRemove, onChange }) {
  const meta = BLOCK_META[block.type];
  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <span>{meta?.icon}</span> {meta?.label || block.type}
        </span>
        <div className="flex items-center gap-1 text-gray-400">
          <button type="button" disabled={index === 0} onClick={onUp} className="px-1 hover:text-brand disabled:opacity-30">▲</button>
          <button type="button" disabled={index === total - 1} onClick={onDown} className="px-1 hover:text-brand disabled:opacity-30">▼</button>
          <button type="button" onClick={onRemove} className="px-1 hover:text-red-600" aria-label="Remove block">🗑</button>
        </div>
      </div>
      <BlockFields block={block} onChange={onChange} />
    </Card>
  );
}

// The "add block" palette, grouped by category.
function Palette({ onAdd }) {
  const [open, setOpen] = useState(false);
  return (
    <Card>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between font-medium text-brand"
      >
        + Add block
        <span className="text-gray-400">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="mt-3 space-y-4">
          {BLOCK_GROUPS.map((group) => (
            <div key={group}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">{group}</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {BLOCK_TYPES.filter((b) => b.group === group).map((b) => (
                  <button
                    key={b.type}
                    type="button"
                    onClick={() => {
                      onAdd(b.type);
                      setOpen(false);
                    }}
                    className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-left text-sm hover:border-brand hover:bg-brand-light"
                  >
                    <span>{b.icon}</span>
                    <span>{b.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// Header with public-link tools (copy / open / QR) + status.
function EditorHeader({ sticker, dirty }) {
  const url = publicUrl(sticker.code);
  const qr = useQr(sticker.code, 112);
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    if (await copy(url)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }

  return (
    <Card className="mb-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex gap-4">
          {qr && <img src={qr} alt="QR code" className="h-24 w-24 rounded-lg" />}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">Edit page</h1>
              <StatusBadge status={sticker.status} />
            </div>
            <code className="mt-1 inline-block rounded bg-gray-100 px-2 py-0.5 text-sm text-gray-700">
              /q/{sticker.code}
            </code>
            <div className="mt-2 flex gap-3 text-sm">
              <button onClick={copyLink} className="font-medium text-brand hover:underline">
                {copied ? "Copied!" : "Copy link"}
              </button>
              <a href={url} target="_blank" rel="noreferrer" className="font-medium text-brand hover:underline">
                Open public page
              </a>
            </div>
          </div>
        </div>
        <Button as="link" to="/dashboard" variant="outline">
          {dirty ? "← Back (unsaved)" : "← Back"}
        </Button>
      </div>
    </Card>
  );
}

function PhoneFrame({ children }) {
  return (
    <div className="mx-auto w-full max-w-[320px] rounded-[2rem] border-8 border-gray-800 bg-white shadow-xl">
      <div className="max-h-[560px] overflow-y-auto rounded-[1.4rem] p-4">{children}</div>
    </div>
  );
}

// Convert a sticker's legacy fixed fields into an equivalent set of blocks, so
// existing pages (and seed data) open as an editable block layout.
function migrateLegacy(sticker) {
  const p = sticker.page || {};
  const out = [];
  const add = (type, props) => out.push({ id: crypto.randomUUID(), type, props });

  if (p.title) add("heading", { text: p.title, align: "left" });
  if (p.imageUrl) add("image", { url: p.imageUrl, caption: "" });
  if (p.description) add("text", { text: p.description });
  if (sticker.template === "links" && p.links?.length) {
    add("links", { items: p.links });
  }
  if (p.note) add("note", { text: p.note });
  if (sticker.template === "lost_found") add("finder_form", { heading: "Found this item?" });

  return out;
}

function Wrap({ children }) {
  return <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>;
}
