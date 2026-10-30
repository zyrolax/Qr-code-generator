// Polished starting points. Applying a template replaces the page's blocks and
// sets a matching theme — it never touches the server contract (these are just
// block arrays + a page.style). Each call returns fresh blocks with new ids.
import { BLOCK_META } from "../blocks/registry.js";

// Build a block of `type` with its registry defaults, overriding some props.
function b(type, overrides = {}) {
  return {
    id: crypto.randomUUID(),
    type,
    props: { ...BLOCK_META[type].make(), ...overrides },
  };
}

export const TEMPLATES = [
  {
    id: "lost_found",
    name: "Lost & Found",
    hint: "Help a finder return your item",
    theme: "warm",
    build: () => [
      b("heading", { text: "Thanks for finding this!", align: "center", size: "l" }),
      b("text", {
        text: "This belongs to someone who’d love it back. Drop them a quick message below and they’ll be in touch.",
        align: "center",
      }),
      b("reward", { amount: "", note: "A small thank-you for your kindness." }),
      b("finder_form", { heading: "Found this item?" }),
    ],
  },
  {
    id: "links",
    name: "Personal Links",
    hint: "A tidy hub for all your links",
    theme: "ivory",
    build: () => [
      b("image", { radius: "full" }),
      b("heading", { text: "Alex Rivera", align: "center", size: "xl" }),
      b("text", { text: "Designer & maker. Here’s where to find me.", align: "center" }),
      b("links", { items: [
        { label: "My portfolio", url: "" },
        { label: "Latest project", url: "" },
      ] }),
      b("socials", { items: [
        { platform: "instagram", url: "" },
        { platform: "linkedin", url: "" },
      ] }),
    ],
  },
  {
    id: "contact",
    name: "Contact Card",
    hint: "Share your details in a tap",
    theme: "mono",
    build: () => [
      b("heading", { text: "Jordan Lee", align: "center", size: "xl" }),
      b("text", { text: "Product Manager · Acme Co.", align: "center" }),
      b("contact", { items: [
        { kind: "phone", label: "Call", value: "" },
        { kind: "email", label: "Email", value: "" },
      ] }),
      b("button", { label: "Visit my website", actionType: "link", value: "" }),
    ],
  },
  {
    id: "product",
    name: "Product Information",
    hint: "Details, specs and support",
    theme: "sage",
    build: () => [
      b("image", {}),
      b("heading", { text: "Model X Water Bottle", size: "l" }),
      b("text", { text: "Keeps drinks cold for 24h. Dishwasher-safe. Replacement parts and care tips below." }),
      b("divider", { variant: "line" }),
      b("links", { items: [
        { label: "User manual (PDF)", url: "" },
        { label: "Order a spare lid", url: "" },
      ] }),
      b("button", { label: "Contact support", actionType: "email", value: "" }),
    ],
  },
  {
    id: "instructions",
    name: "Instructions",
    hint: "A simple how-to guide",
    theme: "ivory",
    build: () => [
      b("heading", { text: "How to get started", size: "l" }),
      b("text", {
        text: "1. Unbox and charge fully.\n2. Hold the power button for 3 seconds.\n3. Open the app and follow the setup.",
        leading: "relaxed",
      }),
      b("divider", { variant: "dots" }),
      b("note", { text: "Stuck? The support link below is the fastest way to reach us." }),
      b("button", { label: "Get help", actionType: "link", value: "" }),
    ],
  },
];
