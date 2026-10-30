// The catalogue of prebuilt blocks the user can drop onto a page.
//
// Each entry describes the Add-Element card (icon/label/description/group) and a
// `make()` that returns the block's default props. The matching display UI lives
// in BlockView.jsx and the editing controls in editor/Inspector.jsx. Keep these
// (plus the server's lib/blocks.js validation) in sync when adding a block.

export const SOCIAL_PLATFORMS = [
  { key: "instagram", label: "Instagram", icon: "📸" },
  { key: "github", label: "GitHub", icon: "🐙" },
  { key: "linkedin", label: "LinkedIn", icon: "💼" },
  { key: "twitter", label: "X / Twitter", icon: "🐦" },
  { key: "youtube", label: "YouTube", icon: "▶️" },
  { key: "facebook", label: "Facebook", icon: "📘" },
  { key: "website", label: "Website", icon: "🌐" },
  { key: "email", label: "Email", icon: "✉️" },
  { key: "phone", label: "Phone", icon: "📞" },
  { key: "whatsapp", label: "WhatsApp", icon: "💬" },
];

export const BLOCK_TYPES = [
  // Basics
  {
    type: "heading",
    label: "Heading",
    icon: "H",
    group: "Text",
    hint: "A title or section header",
    make: () => ({ text: "Your heading", font: "", weight: "bold", size: "l", align: "left", color: "" }),
  },
  {
    type: "text",
    label: "Paragraph",
    icon: "¶",
    group: "Text",
    hint: "A block of body text",
    make: () => ({ text: "Write something about this page…", font: "", size: "m", align: "left", leading: "normal", color: "" }),
  },
  {
    type: "image",
    label: "Image",
    icon: "🖼",
    group: "Media",
    hint: "Upload and position a photo",
    make: () => ({ url: "", caption: "", fit: "cover", focalX: 50, focalY: 50, radius: "lg" }),
  },
  {
    type: "divider",
    label: "Divider",
    icon: "—",
    group: "Media",
    hint: "A visual break between sections",
    make: () => ({ variant: "line" }),
  },

  // Links & contact
  {
    type: "button",
    label: "Button",
    icon: "▭",
    group: "Links & contact",
    hint: "A tappable call-to-action",
    make: () => ({ label: "Tap here", actionType: "link", value: "", style: "primary", color: "", textColor: "", align: "center", fullWidth: true }),
  },
  {
    type: "links",
    label: "Link",
    icon: "🔗",
    group: "Links & contact",
    hint: "One or more labelled links",
    make: () => ({ items: [{ label: "", url: "" }] }),
  },
  {
    type: "socials",
    label: "Social links",
    icon: "✦",
    group: "Links & contact",
    hint: "A row of social icons",
    make: () => ({ items: [{ platform: "instagram", url: "" }] }),
  },
  {
    type: "contact",
    label: "Contact information",
    icon: "✆",
    group: "Links & contact",
    hint: "Phone, email, address…",
    make: () => ({ items: [{ kind: "phone", label: "", value: "" }] }),
  },

  // Lost & found
  {
    type: "note",
    label: "Owner's note",
    icon: "✎",
    group: "Lost & found",
    hint: "A message to whoever finds this",
    make: () => ({ text: "Thanks for finding this! Please…" }),
  },
  {
    type: "finder_form",
    label: "Finder message form",
    icon: "✉",
    group: "Lost & found",
    hint: "Lets a finder message you privately",
    make: () => ({ heading: "Found this item?" }),
  },
  {
    type: "reward",
    label: "Reward offer",
    icon: "🎁",
    group: "Lost & found",
    hint: "Offer a reward for safe return",
    make: () => ({ amount: "", note: "" }),
  },
];

// Lookup by type.
export const BLOCK_META = Object.fromEntries(BLOCK_TYPES.map((b) => [b.type, b]));

// Groups in Add-Element order.
export const BLOCK_GROUPS = ["Text", "Media", "Links & contact", "Lost & found"];

// Build a fresh block instance with a stable id.
export function newBlock(type) {
  return { id: crypto.randomUUID(), type, props: BLOCK_META[type].make() };
}
