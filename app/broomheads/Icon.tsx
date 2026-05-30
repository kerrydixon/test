// Dependency-free inline SVG icons (the repo's lucide-react version is pinned to
// an unusual major, so we avoid relying on its icon set here). Stroke-based,
// 24x24, currentColor — style with text-* and h-/w- utilities.

type IconName =
  | "phone"
  | "flame"
  | "thermometer"
  | "shower"
  | "droplet"
  | "shield"
  | "clock"
  | "home"
  | "check"
  | "pound"
  | "sparkles"
  | "star"
  | "mapPin"
  | "mail"
  | "arrowRight"
  | "chevronDown"
  | "menu"
  | "wrench";

const PATHS: Record<IconName, React.ReactNode> = {
  phone: (
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z" />
  ),
  flame: (
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5Z" />
  ),
  thermometer: (
    <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0Z" />
  ),
  shower: (
    <>
      <path d="M4 4l2.5 2.5M3 21v-1a8 8 0 0 1 8-8h.5M16 6.5A2.5 2.5 0 0 1 18.5 4 2.5 2.5 0 0 1 21 6.5V12" />
      <path d="M12 13v.01M14.5 15.5v.01M17 13v.01M9.5 15.5v.01M12 18v.01" />
    </>
  ),
  droplet: (
    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
  ),
  shield: (
    <>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  home: (
    <>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
      <path d="M9 21v-6h6v6" />
    </>
  ),
  check: <path d="m20 6-11 11-5-5" />,
  pound: (
    <path d="M18 7c0-2.2-1.8-4-4-4s-4 1.8-4 4v3m8 11H6c1.5-1.5 2-3 2-5V8m-3 5h8" />
  ),
  sparkles: (
    <path d="M12 3l1.8 4.6L18 9.4l-4.2 1.8L12 16l-1.8-4.8L6 9.4l4.2-1.8L12 3ZM19 14l.9 2.3L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.7L19 14Z" />
  ),
  star: (
    <path d="M12 2.5l2.9 5.9 6.6.9-4.8 4.6 1.1 6.5L12 17.8 6.2 20.9l1.1-6.5L2.5 9.8l6.6-.9L12 2.5Z" />
  ),
  mapPin: (
    <>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </>
  ),
  mail: (
    <>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m2 6 10 7L22 6" />
    </>
  ),
  arrowRight: <path d="M5 12h14M13 6l6 6-6 6" />,
  chevronDown: <path d="m6 9 6 6 6-6" />,
  menu: <path d="M3 6h18M3 12h18M3 18h18" />,
  wrench: (
    <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.7 2.7-2.7-.7-.7-2.7 2.8-2.6Z" />
  ),
};

export default function Icon({
  name,
  className = "h-6 w-6",
  filled = false,
}: {
  name: IconName;
  className?: string;
  filled?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={filled ? 0 : 2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}
