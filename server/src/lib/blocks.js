import { z } from "zod";

// Validation for the block-based page builder. Each block has a stable `id`,
// a `type`, and a `props` object whose shape depends on the type. We use a
// zod discriminated union so an invalid block type / shape is rejected with a
// clear 400 before anything is saved.
//
// Adding a new block = add a schema here AND a renderer/editor on the client
// (client/src/blocks/*). Keep the two in sync.

const str = (max) => z.string().max(max);
const urlOrEmpty = z.string().url().max(2000).or(z.literal(""));

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
    align: z.enum(["left", "center"]).default("left"),
  })),

  base("text", z.object({ text: str(3000).default("") })),

  base("image", z.object({
    url: urlOrEmpty.default(""),
    caption: str(200).default(""),
  })),

  // A call-to-action / contact button. The owner explicitly opts in to share a
  // contact here (distinct from the automatic rule that we never *silently*
  // expose owner contact on lost&found pages).
  base("button", z.object({
    label: str(60).default("Tap here"),
    actionType: z.enum(["link", "whatsapp", "email", "phone"]).default("link"),
    value: str(500).default(""),
    style: z.enum(["primary", "outline"]).default("primary"),
  })),

  base("links", z.object({ items: z.array(linkItem).max(20).default([]) })),

  base("socials", z.object({
    items: z
      .array(z.object({ platform: z.enum(PLATFORMS), url: str(500).default("") }))
      .max(12)
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

  base("divider", z.object({})),
]);

export const blocksSchema = z.array(blockSchema).max(50).default([]);
