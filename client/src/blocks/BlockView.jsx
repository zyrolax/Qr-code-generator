import { useState } from "react";
import { api } from "../api.js";
import { Button, Input, Textarea, Alert } from "../components/ui.jsx";
import { SOCIAL_PLATFORMS } from "./registry.js";

// Renders one block for display. Shared by the public Scan page (interactive)
// and the editor's live preview (interactive = false, so forms/links are inert).
export function BlockView({ block, code, interactive = false }) {
  const p = block.props || {};
  switch (block.type) {
    case "heading":
      return (
        <h2 className={`text-2xl font-bold ${p.align === "center" ? "text-center" : ""}`}>
          {p.text || "Heading"}
        </h2>
      );

    case "text":
      // whitespace-pre-line keeps the owner's line breaks; still plain text.
      return <p className="whitespace-pre-line text-gray-700">{p.text}</p>;

    case "image":
      return p.url ? (
        <figure>
          <img src={p.url} alt={p.caption || ""} className="max-h-72 w-full rounded-xl object-cover" />
          {p.caption && <figcaption className="mt-1 text-center text-sm text-gray-500">{p.caption}</figcaption>}
        </figure>
      ) : (
        <Placeholder>Image</Placeholder>
      );

    case "divider":
      return <hr className="border-gray-200" />;

    case "button":
      return <ActionButton p={p} interactive={interactive} />;

    case "links":
      return (
        <div className="space-y-2">
          {(p.items || []).filter((l) => l.url || l.label).length === 0 ? (
            <Placeholder>Links</Placeholder>
          ) : (
            (p.items || [])
              .filter((l) => l.url || l.label)
              .map((l, i) => (
                <LinkRow key={i} href={l.url} interactive={interactive}>
                  {l.label || l.url}
                </LinkRow>
              ))
          )}
        </div>
      );

    case "socials":
      return (
        <div className="flex flex-wrap justify-center gap-3">
          {(p.items || []).filter((s) => s.url).length === 0 ? (
            <Placeholder>Social icons</Placeholder>
          ) : (
            (p.items || [])
              .filter((s) => s.url)
              .map((s, i) => {
                const meta = SOCIAL_PLATFORMS.find((m) => m.key === s.platform);
                return (
                  <a
                    key={i}
                    href={interactive ? s.url : undefined}
                    target="_blank"
                    rel="noreferrer"
                    title={meta?.label}
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-xl hover:bg-brand-light"
                  >
                    {meta?.icon || "🔗"}
                  </a>
                );
              })
          )}
        </div>
      );

    case "reward":
      return (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-center">
          <p className="text-sm font-medium text-amber-700">Reward for safe return</p>
          <p className="mt-1 text-2xl font-extrabold text-amber-800">{p.amount || "—"}</p>
          {p.note && <p className="mt-1 text-sm text-amber-700">{p.note}</p>}
        </div>
      );

    case "note":
      return (
        <div className="rounded-xl bg-brand-light/50 p-4">
          <p className="text-sm font-medium text-gray-700">A note from the owner</p>
          <p className="mt-1 whitespace-pre-line text-gray-800">{p.text}</p>
        </div>
      );

    case "finder_form":
      return <FinderForm code={code} interactive={interactive} heading={p.heading} />;

    default:
      return null;
  }
}

// --- building blocks -------------------------------------------------------

function ActionButton({ p, interactive }) {
  // Build the href for the chosen contact/link action. The owner opts in to
  // sharing a contact by adding this block.
  function href() {
    const v = (p.value || "").trim();
    if (!v) return undefined;
    switch (p.actionType) {
      case "whatsapp":
        return `https://wa.me/${v.replace(/[^0-9]/g, "")}`;
      case "email":
        return `mailto:${v}`;
      case "phone":
        return `tel:${v}`;
      default:
        return v;
    }
  }
  const cls =
    p.style === "outline"
      ? "border border-brand text-brand hover:bg-brand-light"
      : "bg-brand text-white hover:bg-brand-dark";
  return (
    <a
      href={interactive ? href() : undefined}
      target={p.actionType === "link" ? "_blank" : undefined}
      rel="noreferrer"
      className={`block rounded-xl px-4 py-3 text-center font-semibold ${cls}`}
    >
      {p.label || "Tap here"}
    </a>
  );
}

function LinkRow({ href, interactive, children }) {
  return (
    <a
      href={interactive ? href : undefined}
      target="_blank"
      rel="noreferrer"
      className="block rounded-xl border border-gray-200 bg-white px-4 py-3 text-center font-medium text-brand hover:bg-brand-light"
    >
      {children}
    </a>
  );
}

function Placeholder({ children }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 p-3 text-center text-sm text-gray-400">
      {children} preview
    </div>
  );
}

// The privacy-safe finder message form. In the editor preview it's inert.
export function FinderForm({ code, interactive, heading }) {
  const [form, setForm] = useState({ foundWhere: "", body: "", finderContact: "" });
  const [status, setStatus] = useState({});

  async function submit(e) {
    e.preventDefault();
    if (!interactive) return;
    setStatus({ sending: true });
    try {
      await api.post(`/q/${code}/message`, form);
      setStatus({ sent: true });
    } catch (err) {
      setStatus({ error: err.message });
    }
  }

  if (status.sent) {
    return <Alert kind="success">Thank you! The owner has been notified.</Alert>;
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl border border-gray-200 p-4">
      <h3 className="font-semibold">{heading || "Found this item?"}</h3>
      <Input
        label="Where did you find it?"
        value={form.foundWhere}
        onChange={(e) => setForm({ ...form, foundWhere: e.target.value })}
        placeholder="e.g. Library 2nd floor"
        disabled={!interactive}
      />
      <Textarea
        label="Message to the owner"
        rows={3}
        required={interactive}
        value={form.body}
        onChange={(e) => setForm({ ...form, body: e.target.value })}
        placeholder="I found this and can return it…"
        disabled={!interactive}
      />
      <Input
        label="Your contact (optional)"
        value={form.finderContact}
        onChange={(e) => setForm({ ...form, finderContact: e.target.value })}
        placeholder="Phone or email, if you're happy to share"
        disabled={!interactive}
      />
      {status.error && <Alert kind="error">{status.error}</Alert>}
      <Button type="submit" disabled={!interactive || status.sending} className="w-full">
        {status.sending ? "Sending…" : "Send message"}
      </Button>
    </form>
  );
}

// Renders an ordered list of blocks with consistent spacing.
export function BlockList({ blocks, code, interactive }) {
  return (
    <div className="space-y-4">
      {blocks.map((b) => (
        <BlockView key={b.id} block={b} code={code} interactive={interactive} />
      ))}
    </div>
  );
}
