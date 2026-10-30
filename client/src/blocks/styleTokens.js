// Maps the small, token-based style props (saved on each block) to concrete
// Tailwind classes. Shared by BlockView (public page + editor canvas) and the
// editor's Inspector controls so the two never drift.
//
// IMPORTANT: every class name must appear here as a full literal string so
// Tailwind's content scanner generates it.

export const FONT_FAMILY = {
  sans: "font-sans",
  serif: "font-serif",
  rounded: "font-rounded",
  mono: "font-mono",
};

export const FONT_WEIGHT = {
  normal: "font-normal",
  medium: "font-medium",
  semibold: "font-semibold",
  bold: "font-bold",
};

export const HEADING_SIZE = {
  s: "text-lg",
  m: "text-xl",
  l: "text-2xl",
  xl: "text-4xl",
};

export const TEXT_SIZE = {
  s: "text-sm",
  m: "text-base",
  l: "text-lg",
};

export const ALIGN = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

// Flex justification equivalent of ALIGN (used to position buttons).
export const JUSTIFY = {
  left: "justify-start",
  center: "justify-center",
  right: "justify-end",
};

export const LEADING = {
  tight: "leading-snug",
  normal: "leading-relaxed",
  relaxed: "leading-loose",
};

export const RADIUS = {
  none: "rounded-none",
  sm: "rounded-md",
  md: "rounded-xl",
  lg: "rounded-2xl",
  full: "rounded-full",
};

// Readable labels + ordered option lists for the Inspector controls.
export const FONT_OPTIONS = [
  { value: "", label: "Theme" },
  { value: "sans", label: "Sans" },
  { value: "serif", label: "Serif" },
  { value: "rounded", label: "Rounded" },
  { value: "mono", label: "Mono" },
];

export const WEIGHT_OPTIONS = [
  { value: "normal", label: "Regular" },
  { value: "medium", label: "Medium" },
  { value: "semibold", label: "Semibold" },
  { value: "bold", label: "Bold" },
];

export const HEADING_SIZE_OPTIONS = [
  { value: "s", label: "S" },
  { value: "m", label: "M" },
  { value: "l", label: "L" },
  { value: "xl", label: "XL" },
];

export const TEXT_SIZE_OPTIONS = [
  { value: "s", label: "S" },
  { value: "m", label: "M" },
  { value: "l", label: "L" },
];

export const ALIGN_OPTIONS = [
  { value: "left", label: "Left" },
  { value: "center", label: "Center" },
  { value: "right", label: "Right" },
];

export const LEADING_OPTIONS = [
  { value: "tight", label: "Tight" },
  { value: "normal", label: "Normal" },
  { value: "relaxed", label: "Airy" },
];

export const RADIUS_OPTIONS = [
  { value: "none", label: "Square" },
  { value: "md", label: "Soft" },
  { value: "lg", label: "Round" },
  { value: "full", label: "Circle" },
];

// A restrained palette offered in colour swatches (empty = inherit theme).
export const SWATCHES = [
  "",
  "#2A2824",
  "#6B6559",
  "#9C6B4A",
  "#3F6B5A",
  "#3C5A82",
  "#8A4B63",
  "#B23B3B",
  "#FFFFFF",
];

// Resolve a token map with a fallback, tolerating missing/legacy values.
export const cls = (map, value, fallback) => map[value] || map[fallback];
