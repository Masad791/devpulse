// A handful of icons (paths from Lucide, ISC license) — not worth an icon library dependency.
type Props = { className?: string };
const base = {
  width: 14,
  height: 14,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

export const ArrowUp = (p: Props) => (
  <svg {...base} {...p}>
    <path d="m5 12 7-7 7 7M12 19V5" />
  </svg>
);
export const Comment = (p: Props) => (
  <svg {...base} {...p}>
    <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
  </svg>
);
export const Heart = (p: Props) => (
  <svg {...base} {...p}>
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
  </svg>
);
export const Repost = (p: Props) => (
  <svg {...base} {...p}>
    <path d="m17 2 4 4-4 4M3 11v-1a4 4 0 0 1 4-4h14M7 22l-4-4 4-4M21 13v1a4 4 0 0 1-4 4H3" />
  </svg>
);
export const Sliders = (p: Props) => (
  <svg {...base} {...p}>
    <path d="M21 4h-7M10 4H3M21 12h-9M8 12H3M21 20h-5M12 20H3M14 2v4M8 10v4M16 18v4" />
  </svg>
);
