import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api.js";
import { Alert, StatusBadge } from "../components/ui.jsx";
import { publicUrl, useQr, copy } from "../lib/sticker.js";
import { newBlock } from "../blocks/registry.js";
import { Canvas } from "../editor/Canvas.jsx";
import { Inspector } from "../editor/Inspector.jsx";
import { AddElement } from "../editor/AddElement.jsx";
import { ImageEditor } from "../editor/ImageEditor.jsx";
import { TemplatePicker } from "../editor/TemplatePicker.jsx";
import { useHistory } from "../editor/useHistory.js";

// Visual, direct-manipulation page editor. The phone canvas IS the editing
// surface; the Inspector shows controls for the current selection; themes and
// starting templates restyle without losing content. Reads/writes the same
// block array + page.style contract (PUT /stickers/:id/page).
export default function Editor() {
  const { id } = useParams();
  const [sticker, setSticker] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [saved, setSaved] = useState(null); // JSON snapshot of last save
  const [status, setStatus] = useState({});

  // Overlays / mobile sheet.
  const [adding, setAdding] = useState(false);
  const [editingImageId, setEditingImageId] = useState(null);
  const [picking, setPicking] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const { state, set, reset, undo, redo, canUndo, canRedo } = useHistory({ blocks: [], style: {} });
  const { blocks, style } = state;

  useEffect(() => {
    api
      .get(`/stickers/${id}`)
      .then(({ sticker }) => {
        setSticker(sticker);
        const initial = sticker.page?.blocks?.length ? sticker.page.blocks : migrateLegacy(sticker);
        const pageStyle = sticker.page?.style || {};
        reset({ blocks: initial, style: pageStyle });
        setSaved(JSON.stringify({ blocks: initial, style: pageStyle }));
      })
      .catch((err) => setStatus({ error: err.message }));
  }, [id, reset]);

  const dirty = saved !== null && JSON.stringify(state) !== saved;

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

  // --- state operations -----------------------------------------------------
  const selected = useMemo(() => blocks.find((b) => b.id === selectedId) || null, [blocks, selectedId]);

  function select(blockId) {
    setSelectedId(blockId);
    if (blockId) setSheetOpen(true);
  }

  function addBlock(type) {
    const block = newBlock(type);
    const at = selected ? blocks.findIndex((b) => b.id === selected.id) + 1 : blocks.length;
    const next = [...blocks.slice(0, at), block, ...blocks.slice(at)];
    set({ blocks: next, style });
    setSelectedId(block.id);
    setAdding(false);
    if (type === "image") setEditingImageId(block.id);
    else setSheetOpen(true);
  }

  function removeBlock(blockId) {
    set({ blocks: blocks.filter((b) => b.id !== blockId), style });
    if (selectedId === blockId) {
      setSelectedId(null);
      setSheetOpen(false);
    }
  }

  function changeBlock(blockId, props, opts = {}) {
    set({ blocks: blocks.map((b) => (b.id === blockId ? { ...b, props } : b)), style }, opts);
  }

  const reorder = (nextBlocks) => set({ blocks: nextBlocks, style });
  const changeStyle = (nextStyle) => set({ blocks, style: nextStyle });

  function applyTemplate(tpl) {
    set({ blocks: tpl.build(), style: { ...style, theme: tpl.theme } });
    setSelectedId(null);
    setPicking(false);
  }

  function onImageDone(url) {
    const b = blocks.find((x) => x.id === editingImageId);
    if (b) changeBlock(editingImageId, { ...b.props, url, focalX: 50, focalY: 50, fit: b.props.fit || "cover" });
    setEditingImageId(null);
  }

  async function save() {
    if (status.saving) return;
    setStatus({ saving: true });
    const template = blocks.some((b) => b.type === "finder_form") ? "lost_found" : "links";
    try {
      const { sticker: updated } = await api.put(`/stickers/${id}/page`, { template, blocks, style });
      setSticker(updated);
      setSaved(JSON.stringify({ blocks, style }));
      setStatus({ saved: true });
      setTimeout(() => setStatus((s) => (s.saved ? {} : s)), 2500);
    } catch (err) {
      setStatus({ error: err.message });
    }
  }

  if (status.error && !sticker) return <ErrorScreen message={status.error} />;
  if (!sticker) return <div className="grid min-h-screen place-items-center bg-paper text-ink/50">Loading…</div>;

  return (
    <div className="flex min-h-screen flex-col bg-paper text-ink">
      <Toolbar
        sticker={sticker}
        dirty={dirty}
        status={status}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        onAdd={() => setAdding(true)}
        onTemplates={() => setPicking(true)}
        onSave={save}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Canvas — click empty space to deselect (shows page settings). */}
        <div
          className="flex-1 overflow-y-auto px-4 py-8"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedId(null);
              setSheetOpen(false);
            }
          }}
        >
          <Canvas
            blocks={blocks}
            style={style}
            selectedId={selectedId}
            status={sticker.status}
            onSelect={select}
            onReorder={reorder}
            onChangeBlock={changeBlock}
            onEditImage={(bid) => { setSelectedId(bid); setEditingImageId(bid); }}
            onAddFirst={() => setAdding(true)}
          />
        </div>

        {/* Desktop inspector */}
        <aside className="hidden w-80 shrink-0 overflow-y-auto border-l border-ink/10 bg-panel p-5 lg:block">
          {selected && (
            <button onClick={() => setSelectedId(null)} className="mb-3 text-xs text-ink/45 hover:text-ink">
              ← Page settings
            </button>
          )}
          <Inspector
            block={selected}
            onChange={changeBlock}
            onEditImage={() => selected && setEditingImageId(selected.id)}
            style={style}
            onStyleChange={changeStyle}
          />
          {selected && (
            <button
              onClick={() => removeBlock(selected.id)}
              className="mt-6 w-full rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              Delete element
            </button>
          )}
        </aside>
      </div>

      {/* Mobile bottom toolbar */}
      <MobileBar
        onAdd={() => setAdding(true)}
        onPage={() => { setSelectedId(null); setSheetOpen(true); }}
        onTemplates={() => setPicking(true)}
      />

      {/* Mobile bottom sheet */}
      {sheetOpen && (
        <div className="fixed inset-x-0 bottom-0 z-40 max-h-[70vh] overflow-y-auto rounded-t-2xl border-t border-ink/10 bg-panel p-5 shadow-2xl lg:hidden">
          <div className="mb-3 flex items-center justify-between">
            <div className="mx-auto h-1 w-10 rounded-full bg-ink/15" />
            <button onClick={() => setSheetOpen(false)} className="absolute right-5 text-ink/40 hover:text-ink">✕</button>
          </div>
          <Inspector
            block={selected}
            onChange={changeBlock}
            onEditImage={() => selected && setEditingImageId(selected.id)}
            style={style}
            onStyleChange={changeStyle}
          />
          {selected && (
            <button
              onClick={() => removeBlock(selected.id)}
              className="mt-6 w-full rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              Delete element
            </button>
          )}
        </div>
      )}

      {adding && <AddElement onAdd={addBlock} onClose={() => setAdding(false)} />}
      {picking && <TemplatePicker onApply={applyTemplate} onClose={() => setPicking(false)} />}
      {editingImageId && <ImageEditor onDone={onImageDone} onClose={() => setEditingImageId(null)} />}
    </div>
  );
}

// --- toolbar ---------------------------------------------------------------
function Toolbar({ sticker, dirty, status, canUndo, canRedo, onUndo, onRedo, onAdd, onTemplates, onSave }) {
  return (
    <header className="z-20 flex items-center gap-2 border-b border-ink/10 bg-panel/90 px-4 py-2.5 backdrop-blur">
      <a href="/dashboard" className="rounded-lg px-2 py-1.5 text-sm text-ink/60 hover:text-ink" title="Back to dashboard">←</a>
      <div className="flex items-center gap-2">
        <span className="font-semibold">Page editor</span>
        <code className="hidden rounded bg-ink/5 px-1.5 py-0.5 text-xs text-ink/60 sm:inline">/q/{sticker.code}</code>
        <StatusBadge status={sticker.status} />
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <IconBtn onClick={onUndo} disabled={!canUndo} title="Undo">↺</IconBtn>
        <IconBtn onClick={onRedo} disabled={!canRedo} title="Redo">↻</IconBtn>
        <span className="mx-1 hidden h-5 w-px bg-ink/10 sm:block" />
        <ToolbarBtn onClick={onTemplates} className="hidden sm:inline-flex">Templates</ToolbarBtn>
        <ToolbarBtn onClick={onAdd} className="hidden sm:inline-flex">+ Add</ToolbarBtn>
        <ShareMenu sticker={sticker} />
        <a
          href={publicUrl(sticker.code)}
          target="_blank"
          rel="noreferrer"
          className="hidden rounded-lg border border-ink/15 px-3 py-1.5 text-sm font-medium text-ink/80 hover:border-ink/40 sm:inline-flex"
        >
          Preview
        </a>
        <button
          onClick={onSave}
          disabled={status.saving || !dirty}
          className="rounded-lg bg-ink px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-ink/85 disabled:opacity-40"
        >
          {status.saving ? "Saving…" : status.saved && !dirty ? "Saved ✓" : "Save"}
        </button>
      </div>
      {status.error && (
        <div className="absolute inset-x-0 top-full px-4">
          <Alert kind="error">{status.error}</Alert>
        </div>
      )}
    </header>
  );
}

function ShareMenu({ sticker }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const url = publicUrl(sticker.code);
  const qr = useQr(sticker.code, 160);

  async function copyLink() {
    if (await copy(url)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }

  return (
    <div className="relative">
      <ToolbarBtn onClick={() => setOpen((o) => !o)}>Share</ToolbarBtn>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-20 mt-2 w-56 rounded-xl border border-ink/10 bg-white p-4 shadow-xl">
            {qr && <img src={qr} alt="QR code" className="mx-auto mb-3 h-36 w-36 rounded-lg" />}
            <code className="mb-2 block truncate rounded bg-ink/5 px-2 py-1 text-xs text-ink/70">/q/{sticker.code}</code>
            <button onClick={copyLink} className="w-full rounded-lg border border-ink/15 px-3 py-1.5 text-sm font-medium hover:border-ink/40">
              {copied ? "Copied!" : "Copy link"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function ToolbarBtn({ className = "", children, ...props }) {
  return (
    <button
      className={`inline-flex items-center rounded-lg border border-ink/15 px-3 py-1.5 text-sm font-medium text-ink/80 transition hover:border-ink/40 hover:text-ink ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

function IconBtn({ className = "", children, ...props }) {
  return (
    <button
      className={`grid h-8 w-8 place-items-center rounded-lg text-lg text-ink/70 transition hover:bg-ink/5 disabled:opacity-30 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

function MobileBar({ onAdd, onPage, onTemplates }) {
  return (
    <nav className="sticky bottom-0 z-20 flex items-center justify-around border-t border-ink/10 bg-panel/95 py-2 backdrop-blur lg:hidden">
      <MobileAction onClick={onAdd} icon="＋" label="Add" />
      <MobileAction onClick={onPage} icon="◫" label="Page" />
      <MobileAction onClick={onTemplates} icon="▦" label="Templates" />
    </nav>
  );
}

function MobileAction({ onClick, icon, label }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-0.5 px-4 py-1 text-ink/70">
      <span className="text-lg">{icon}</span>
      <span className="text-[11px]">{label}</span>
    </button>
  );
}

function ErrorScreen({ message }) {
  return (
    <div className="grid min-h-screen place-items-center bg-paper p-4">
      <Alert kind="error">{message}</Alert>
    </div>
  );
}

// Convert a sticker's legacy fixed fields into an equivalent set of blocks, so
// existing pages (and seed data) open as an editable block layout.
function migrateLegacy(sticker) {
  const p = sticker.page || {};
  const out = [];
  const add = (type, props) => out.push({ id: crypto.randomUUID(), type, props: { ...props } });

  if (p.title) add("heading", { text: p.title, align: "left", size: "l", weight: "bold" });
  if (p.imageUrl) add("image", { url: p.imageUrl, caption: "", fit: "cover", focalX: 50, focalY: 50, radius: "lg" });
  if (p.description) add("text", { text: p.description });
  if (sticker.template === "links" && p.links?.length) add("links", { items: p.links });
  if (p.note) add("note", { text: p.note });
  if (sticker.template === "lost_found") add("finder_form", { heading: "Found this item?" });

  return out;
}
