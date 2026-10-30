// Page themes: distinct visual looks a page can wear WITHOUT changing its
// content (blocks). A theme sets the page background, the content card style,
// a default accent colour (used by buttons/links that don't set their own),
// the default text colour, and a default font. Persisted on `page.style`.
//
// Shared by the public page (Scan.jsx) and the editor canvas via BlockView's
// PageShell, so switching a theme looks identical in both.

export const THEMES = [
  {
    id: "warm",
    name: "Warm",
    pageBg: "#F3EEE6", // warm neutral paper
    cardBg: "#FBF8F3",
    cardBorder: "#E7DFD2",
    ink: "#2A2824", // charcoal
    muted: "#7A7267",
    accent: "#9C6B4A", // clay
    font: "sans",
  },
  {
    id: "ivory",
    name: "Ivory",
    pageBg: "#F7F5F0",
    cardBg: "#FFFFFF",
    cardBorder: "#ECE8DF",
    ink: "#23201C",
    muted: "#857E72",
    accent: "#3F6B5A", // muted green
    font: "serif",
  },
  {
    id: "midnight",
    name: "Midnight",
    pageBg: "#17181C",
    cardBg: "#1F2126",
    cardBorder: "#2E3137",
    ink: "#ECECEA",
    muted: "#9A9CA2",
    accent: "#C9A26B", // warm gold
    font: "sans",
  },
  {
    id: "sage",
    name: "Sage",
    pageBg: "#E9EDE5",
    cardBg: "#FBFCF9",
    cardBorder: "#DCE2D3",
    ink: "#2B2F28",
    muted: "#6F7568",
    accent: "#5B7355",
    font: "rounded",
  },
  {
    id: "mono",
    name: "Mono",
    pageBg: "#FFFFFF",
    cardBg: "#FFFFFF",
    cardBorder: "#E6E6E6",
    ink: "#111111",
    muted: "#6B6B6B",
    accent: "#111111",
    font: "mono",
  },
];

export const DEFAULT_THEME = THEMES[0];

export function getTheme(id) {
  return THEMES.find((t) => t.id === id) || DEFAULT_THEME;
}

// Merge a saved page.style over its theme's defaults into a flat set of
// resolved values the renderer can use directly.
export function resolveStyle(style = {}) {
  const theme = getTheme(style.theme);
  return {
    theme: theme.id,
    pageBg: style.background || theme.pageBg,
    cardBg: theme.cardBg,
    cardBorder: theme.cardBorder,
    ink: theme.ink,
    muted: theme.muted,
    accent: style.accent || theme.accent,
    font: style.font || theme.font,
    fontScale: style.fontScale || 1,
  };
}
