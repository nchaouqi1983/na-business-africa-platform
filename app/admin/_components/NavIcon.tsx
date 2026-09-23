export type NavIconName =
  | "dashboard"
  | "today"
  | "bell"
  | "building"
  | "upload"
  | "inbox"
  | "users"
  | "calendar"
  | "target"
  | "flag"
  | "user"
  | "briefcase"
  | "layers"
  | "handshake"
  | "file-text"
  | "percent"
  | "settings"
  | "chevron-down"
  | "search";

const paths: Record<NavIconName, string> = {
  dashboard: "M4 13h6V4H4v9Zm0 7h6v-5H4v5Zm10 0h6V11h-6v9Zm0-16v5h6V4h-6Z",
  today: "M4 5h16v15H4V5Zm0 4h16M8 3v4M16 3v4M8 14h2M8 17h2",
  bell: "M6 9a6 6 0 0 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 13 6 9Zm4.5 8.5a1.5 1.5 0 0 0 3 0",
  building: "M5 21V5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v16M13 21V9a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v12M3 21h18M8 8h0M8 12h0M8 16h0",
  upload: "M12 16V4M8 8l4-4 4 4M4 16v4h16v-4",
  inbox: "M4 12h4l2 3h4l2-3h4M4 12 5.5 5h13L20 12M4 12v7h16v-7",
  users: "M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm9 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM2 20c0-3 2.5-5 6-5s6 2 6 5M14 20c0-2.5 2-4.5 5-4.5s5 2 5 4.5",
  calendar: "M4 5h16v15H4V5Zm0 4h16M8 3v4M16 3v4M9 14h1M14 14h1M9 17h1M14 17h1",
  flag: "M5 21V4m0 1h12l-3 4 3 4H5",
  target: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-4a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0-4a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9c0-3.9 3.1-7 7-7s7 3.1 7 7",
  briefcase: "M4 8h16v11H4V8Zm4 0V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M4 13h16",
  layers: "m12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5",
  handshake: "M3 11l4-4 4 2 2-2 4 4M7 7l4 4-2 2M11 11l4 4-2 2M3 11v3l4 4M21 11v3l-4 4",
  "file-text": "M7 3h7l4 4v14H7V3Zm7 0v4h4M9 12h6M9 16h6",
  percent: "M6 18 18 6M7 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm10 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z",
  settings:
    "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8-3a8 8 0 0 0-.15-1.5l2-1.5-2-3.5-2.3 1a8 8 0 0 0-2.6-1.5L14.5 2h-5l-.45 2.5a8 8 0 0 0-2.6 1.5l-2.3-1-2 3.5 2 1.5A8 8 0 0 0 4 12c0 .5.05 1 .15 1.5l-2 1.5 2 3.5 2.3-1a8 8 0 0 0 2.6 1.5L9.5 22h5l.45-2.5a8 8 0 0 0 2.6-1.5l2.3 1 2-3.5-2-1.5c.1-.5.15-1 .15-1.5Z",
  "chevron-down": "m6 9 6 6 6-6",
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm10 2-4.35-4.35",
};

export default function NavIcon({ name, className = "h-[18px] w-[18px]" }: { name: NavIconName; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d={paths[name]} />
    </svg>
  );
}
