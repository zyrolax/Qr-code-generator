// The catalogue of prebuilt blocks the user can drop onto a page.
//
// Each entry describes the palette button (icon/label/group) and a `make()`
// that returns the block's default props. The matching display + edit UI live
// in BlockView.jsx and BlockFields.jsx. Keep all three (plus the server's
// lib/blocks.js validation) in sync when adding a block.

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
  { type: "heading", label: "Heading", icon: "🔠", group: "Basics", make: () => ({ text: "Heading", align: "left" }) },
  { type: "text", label: "Text", icon: "¶", group: "Basics", make: () => ({ text: "" }) },
  { type: "image", label: "Image", icon: "🖼️", group: "Basics", make: () => ({ url: "", caption: "" }) },
  { type: "divider", label: "Divider", icon: "➖", group: "Basics", make: () => ({}) },

  // Links & contact
  { type: "button", label: "Button", icon: "🔘", group: "Links & contact", make: () => ({ label: "Tap here", actionType: "link", value: "", style: "primary" }) },
  { type: "links", label: "Link list", icon: "🔗", group: "Links & contact", make: () => ({ items: [{ label: "", url: "" }] }) },
  { type: "socials", label: "Social icons", icon: "✨", group: "Links & contact", make: () => ({ items: [{ platform: "instagram", url: "" }] }) },

  // Lost & found
  { type: "finder_form", label: "Finder message form", icon: "📨", group: "Lost & found", make: () => ({ heading: "Found this item?" }) },
  { type: "note", label: "Owner note", icon: "📝", group: "Lost & found", make: () => ({ text: "Thanks for finding this! Please…" }) },
  { type: "reward", label: "Reward offer", icon: "🎁", group: "Lost & found", make: () => ({ amount: "", note: "" }) },
];

// Lookup by type.
export const BLOCK_META = Object.fromEntries(BLOCK_TYPES.map((b) => [b.type, b]));

// Groups in palette order.
export const BLOCK_GROUPS = ["Basics", "Links & contact", "Lost & found"];

// Build a fresh block instance with a stable id.
export function newBlock(type) {
  return { id: crypto.randomUUID(), type, props: BLOCK_META[type].make() };
}
