import { useState } from "react";
import { api } from "../api.js";
import { Button, Input, Textarea, Alert } from "../components/ui.jsx";
import { SOCIAL_PLATFORMS } from "./registry.js";
import {
  FONT_FAMILY,
  FONT_WEIGHT,
  HEADING_SIZE,
  TEXT_SIZE,
  ALIGN,
  JUSTIFY,
  LEADING,
  RADIUS,
  cls,
} from "./styleTokens.js";
import { resolveStyle } from "./themes.js";

// Renders one block for display. Shared by the public Scan page (interactive)
// and the editor's live canvas (interactive = false, so forms/links are inert).
// Reads the token-based style props (font/size/colour/align/…); blocks saved
// before those props existed fall back to sensible defaults.

// --- class helpers (also reused by the editor's inline text editing) -------
export function headingClasses(p = {}) {
  return [
    cls(HEADING_SIZE, p.size, "l"),
    cls(FONT_WEIGHT, p.weight, "bold"),
    FONT_FAMILY[p.font] || "",
    cls(ALIGN, p.align, "left"),
    "tracking-tight",
  ]
    .filter(Boolean)
    .join(" ");
}

export function textClasses(p = {}) {
  return [
    cls(TEXT_SIZE, p.size, "m"),
    FONT_FAMILY[p.font] || "",
    cls(ALIGN, p.align, "left"),
    cls(LEADING, p.leading, "normal"),
  ]
    .filter(Boolean)
    .join(" ");
}

const colorStyle = (c) => (c ? { color: c } : undefined);

export function BlockView({ block, code, interactive = false }) {
  const p = block.props || {};
  switch (block.type) {
    case "heading":
      return (
        <h2 className={headingClasses(p)} style={colorStyle(p.color)}>
          {p.text || "Heading"}
        </h2>
      );

    case "text":
      // whitespace-pre-line keeps the owner's line breaks; still plain text.
      return (
        <p className={`whitespace-pre-line ${textClasses(p)}`} style={colorStyle(p.color) || { color: "var(--muted)" }}>
          {p.text || (interactive ? "" : "Paragraph text")}
        </p>
      );

    case "image":
      return <ImageBlock p={p} />;

    case "divider":
      return <Divider variant={p.variant} />;

    case "button":
      return <ActionButton p={p} interactive={interactive} />;

    case "links":
      return (
        <div className="space-y-2.5">
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
                    className="flex h-12 w-12 items-center justify-center rounded-full text-xl shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                    style={{ background: "color-mix(in srgb, var(--accent) 12%, transparent)" }}
                  >
                    {meta?.icon || "🔗"}
                  </a>
                );
              })
          )}
        </div>
      );

    case "contact":
      return <ContactBlock items={p.items} interactive={interactive} />;

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
        <div className="rounded-xl p-4" style={{ background: "color-mix(in srgb, var(--accent) 9%, transparent)" }}>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--accent)" }}>
            A note from the owner
          </p>
          <p className="mt-1 whitespace-pre-line" style={{ color: "var(--ink)" }}>
            {p.text}
          </p>
        </div>
      );

    case "finder_form":
      return <FinderForm code={code} interactive={interactive} heading={p.heading} />;

    default:
      return null;
  }
}

// --- building blocks -------------------------------------------------------

function ImageBlock({ p }) {
  const radius = cls(RADIUS, p.radius, "lg");
  if (!p.url) {
    return (
      <div className={`flex aspect-[4/3] items-center justify-center border border-dashed ${radius}`}
        style={{ borderColor: "var(--card-border)", color: "var(--muted)" }}>
        <span className="text-sm">Tap to add an image</span>
      </div>
    );
  }
  return (
    <figure>
      <img
        src={p.url}
        alt={p.caption || ""}
        className={`max-h-80 w-full ${radius}`}
        style={{
          objectFit: p.fit === "contain" ? "contain" : "cover",
          objectPosition: `${p.focalX ?? 50}% ${p.focalY ?? 50}%`,
        }}
      />
      {p.caption && (
        <figcaption className="mt-1.5 text-center text-sm" style={{ color: "var(--muted)" }}>
          {p.caption}
        </figcaption>
      )}
    </figure>
  );
}

function Divider({ variant }) {
  if (variant === "space") return <div className="h-6" />;
  if (variant === "dots")
    return (
      <div className="flex justify-center gap-1.5 py-1" style={{ color: "var(--muted)" }}>
        <span>·</span><span>·</span><span>·</span>
      </div>
    );
  return <hr style={{ borderColor: "var(--card-border)" }} />;
}

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
  const accent = p.color || "var(--accent)";
  const style =
    p.style === "outline"
      ? { border: `2px solid ${accent}`, color: p.textColor || accent }
      : { background: accent, color: p.textColor || "#fff" };
  const justify = cls(JUSTIFY, p.align, "center");
  return (
    <div className={`flex ${justify}`}>
      <a
        href={interactive ? href() : undefined}
        target={p.actionType === "link" ? "_blank" : undefined}
        rel="noreferrer"
        style={style}
        className={`${p.fullWidth === false ? "inline-block" : "block w-full"} rounded-xl px-5 py-3 text-center font-semibold shadow-sm transition-transform hover:-translate-y-0.5 active:translate-y-0`}
      >
        {p.label || "Tap here"}
      </a>
    </div>
  );
}

function LinkRow({ href, interactive, children }) {
  return (
    <a
      href={interactive ? href : undefined}
      target="_blank"
      rel="noreferrer"
      className="block rounded-xl border px-4 py-3 text-center font-medium shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
      style={{ borderColor: "var(--card-border)", color: "var(--accent)", background: "var(--card-bg)" }}
    >
      {children}
    </a>
  );
}

const CONTACT_META = {
  phone: { icon: "📞", href: (v) => `tel:${v}` },
  email: { icon: "✉️", href: (v) => `mailto:${v}` },
  address: { icon: "📍", href: () => undefined },
  website: { icon: "🌐", href: (v) => v },
  custom: { icon: "•", href: () => undefined },
};

function ContactBlock({ items, interactive }) {
  const rows = (items || []).filter((it) => it.value || it.label);
  if (rows.length === 0) return <Placeholder>Contact details</Placeholder>;
  return (
    <div className="space-y-2">
      {rows.map((it, i) => {
        const meta = CONTACT_META[it.kind] || CONTACT_META.custom;
        const href = interactive ? meta.href(it.value) : undefined;
        const Inner = (
          <>
            <span className="text-lg">{meta.icon}</span>
            <span className="min-w-0">
              {it.label && <span className="block text-xs" style={{ color: "var(--muted)" }}>{it.label}</span>}
              <span className="block truncate font-medium" style={{ color: "var(--ink)" }}>
                {it.value || "—"}
              </span>
            </span>
          </>
        );
        const base = "flex items-center gap-3 rounded-xl border px-4 py-2.5";
        const styleObj = { borderColor: "var(--card-border)", background: "var(--card-bg)" };
        return href ? (
          <a key={i} href={href} className={`${base} transition-all hover:-translate-y-0.5 hover:shadow-sm`} style={styleObj}>
            {Inner}
          </a>
        ) : (
          <div key={i} className={base} style={styleObj}>
            {Inner}
          </div>
        );
      })}
    </div>
  );
}

function Placeholder({ children }) {
  return (
    <div className="rounded-xl border border-dashed p-3 text-center text-sm"
      style={{ borderColor: "var(--card-border)", color: "var(--muted)" }}>
      {children}
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
    <form onSubmit={submit} className="space-y-3 rounded-xl border p-4" style={{ borderColor: "var(--card-border)" }}>
      <h3 className="font-semibold" style={{ color: "var(--ink)" }}>{heading || "Found this item?"}</h3>
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
    <div className="space-y-5">
      {blocks.map((b) => (
        <BlockView key={b.id} block={b} code={code} interactive={interactive} />
      ))}
    </div>
  );
}

// Themed page frame: applies the page.style theme (background, card, accent,
// typography) via CSS variables so every descendant inherits the look. Used by
// both the public page and the editor canvas so the preview matches what ships.
export function PageShell({ style, className = "", children }) {
  const s = resolveStyle(style);
  const fontClass = FONT_FAMILY[s.font] || "font-sans";
  const vars = {
    "--ink": s.ink,
    "--muted": s.muted,
    "--accent": s.accent,
    "--card-bg": s.cardBg,
    "--card-border": s.cardBorder,
    background: s.pageBg,
    color: s.ink,
  };
  return (
    <div className={`${fontClass} ${className}`} style={vars}>
      {children}
    </div>
  );
}

// The themed white content card the blocks sit on. Reads the CSS vars set by
// the surrounding PageShell.
export function ContentCard({ className = "", children }) {
  return (
    <div
      className={`rounded-3xl border p-6 shadow-sm ${className}`}
      style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
    >
      {children}
    </div>
  );
}
