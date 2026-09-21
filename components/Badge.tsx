import type { ReactNode } from "react";

type Tone = "gold" | "anthracite" | "outline";

type BadgeProps = {
  children: ReactNode;
  tone?: Tone;
  className?: string;
};

const toneStyles: Record<Tone, string> = {
  gold: "bg-gold-500 text-anthracite-950",
  anthracite: "bg-anthracite-900 text-white",
  outline: "border border-anthracite-300 text-anthracite-700",
};

export default function Badge({ children, tone = "gold", className = "" }: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider",
        toneStyles[tone],
        className,
      ].join(" ")}
    >
      {children}
    </span>
  );
}
