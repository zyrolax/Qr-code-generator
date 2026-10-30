import { z } from "zod";

// Validation for the block-based page builder. Each block has a stable `id`,
// a `type`, and a `props` object whose shape depends on the type. We use a
// zod discriminated union so an invalid block type / shape is rejected with a
// clear 400 before anything is saved.
//
// Adding a new block = add a schema here AND a renderer/editor on the client
// (client/src/blocks/*). Keep the two in sync.
//
// Styling note: the visual editor lets owners tune typography/colour per block.
// Those style fields are all OPTIONAL with defaults, so blocks saved by older
// clients (which only sent e.g. `text`/`align`) still validate and render.

const str = (max) => z.string().max(max);
const urlOrEmpty = z.string().url().max(2000).or(z.literal(""));
// An image source: a full external URL, a path to an image we hosted via the
// upload endpoint (/api/uploads/<file>), or empty.
const imageSrc = z
  .string()
  .url()
  .max(2000)
  .or(z.string().regex(/^\/api\/uploads\/[\w.-]+$/))
  .or(z.literal(""));

// A colour is either empty (meaning "inherit the theme") or a hex value. We
// validate the format so a colour can be safely interpolated into inline CSS.
const color = z
  .string()
  .regex(/^#[0-9a-fA-F]{3,8}$/)
  .or(z.literal(""))
  .default("");

// Shared typography enums (kept small and token-based, mapped to CSS on the
// client in BlockView.jsx). An empty font means "inherit the page theme font".
const font = z.enum(["", "sans", "serif", "rounded", "mono"]).default("");
const weight = z.enum(["normal", "medium", "semibold", "bold"]).default("bold");
const align = z.enum(["left", "center", "right"]).default("left");
const leading = z.enum(["tight", "normal", "relaxed"]).default("normal");

const linkItem = z.object({
  label: str(80).default(""),
  url: urlOrEmpty.default(""),
});

// Contact/social platforms we render with a prebuilt style + icon.
const PLATFORMS = [
  "instagram",
  "github",
  "linkedin",
  "twitter",
  "youtube",
  "facebook",
  "website",
  "email",
  "phone",
  "whatsapp",
];

const base = (type, props) =>
  z.object({ id: str(64), type: z.literal(type), props });

export const blockSchema = z.discriminatedUnion("type", [
  base("heading", z.object({
    text: str(120).default(""),
    font,
    weight,
    size: z.enum(["s", "m", "l", "xl"]).default("l"),
    align,
    color,
  })),

  base("text", z.object({
    text: str(3000).default(""),
    font,
    size: z.enum(["s", "m", "l"]).default("m"),
    align,
    leading,
    color,
  })),

  base("image", z.object({
    url: imageSrc.default(""),
    caption: str(200).default(""),
    fit: z.enum(["cover", "contain"]).default("cover"),
    focalX: z.number().min(0).max(100).default(50),
    focalY: z.number().min(0).max(100).default(50),
    radius: z.enum(["none", "sm", "md", "lg", "full"]).default("lg"),
  })),

  // A call-to-action / contact button. The owner explicitly opts in to share a
  // contact here (distinct from the automatic rule that we never *silently*
  // expose owner contact on lost&found pages).
  base("button", z.object({
    label: str(60).default("Tap here"),
    actionType: z.enum(["link", "whatsapp", "email", "phone"]).default("link"),
    value: str(500).default(""),
    style: z.enum(["primary", "outline"]).default("primary"),
    color: color,
    textColor: color,
    align,
    fullWidth: z.boolean().default(true),
  })),

  base("links", z.object({ items: z.array(linkItem).max(20).default([]) })),

  base("socials", z.object({
    items: z
      .array(z.object({ platform: z.enum(PLATFORMS), url: str(500).default("") }))
      .max(12)
      .default([]),
  })),

  // Owner-provided contact details (phone / email / address / website). Like
  // the button, this is an explicit opt-in to display contact info.
  base("contact", z.object({
    items: z
      .array(
        z.object({
          kind: z.enum(["phone", "email", "address", "website", "custom"]).default("phone"),
          label: str(60).default(""),
          value: str(300).default(""),
        })
      )
      .max(10)
      .default([]),
  })),

  // The privacy-safe "I found this" message form (no owner contact shown).
  base("finder_form", z.object({ heading: str(120).default("Found this item?") })),

  base("reward", z.object({
    amount: str(40).default(""),
    note: str(300).default(""),
  })),

  // Styled callout for the owner's note to a finder.
  base("note", z.object({ text: str(2000).default("") })),

  base("divider", z.object({
    variant: z.enum(["line", "dots", "space"]).default("line"),
  })),
]);

export const blocksSchema = z.array(blockSchema).max(50).default([]);

// Page-level presentation (theme, background, global typography scale). Stored
// on `page.style`; all fields optional so pages saved before themes existed
// fall back to the default "warm" look.
export const styleSchema = z
  .object({
    theme: str(40).default("warm"),
    font,
    background: color,
    accent: color,
    fontScale: z.number().min(0.8).max(1.4).default(1),
  })
  .default({});
