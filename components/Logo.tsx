type BrandLockupProps = {
  tone?: "light" | "dark";
  tagline?: boolean;
  className?: string;
};

/** Monogramme vectoriel NA Business Africa, partagé par le header et le footer. */
export function LogoMark({ className = "h-8 w-auto" }: { className?: string }) {
  return (
    <svg viewBox="-4 -4 369 260" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M.2,249.5c5.5.8,7.5-1,7.1-3.8V57.8c0,0,175.5,193.6,175.5,193.6l.9-78.2h108.4s34,76.6,34,76.6l34.8-1.3L250.6,0l-17.5,40.2,55.8,125.5h-105.2s0-160.2,0-160.2l-7.7-.2v190.8c.1,0-17.6-18.5-17.6-18.5L0,1.9l.2,247.6Z"
      />
      <path
        fill="currentColor"
        d="M.2,249.5L0,1.9l158.4,175.8,17.8,18.5V5.3c-.1,0,7.5.2,7.5.2v160.3s105.2,0,105.2,0l-55.8-125.5L250.6,0l110.4,248.6-34.8,1.3-34-76.6h-108.4s-.9,78.2-.9,78.2L7.5,57.8v187.9c.3,2.8-1.7,4.6-7.2,3.8Z"
      />
    </svg>
  );
}

/** Lockup marque (monogramme + texte) utilisé par le header et le footer. */
export default function BrandLockup({ tone = "light", tagline = true, className = "" }: BrandLockupProps) {
  const isDark = tone === "dark";

  return (
    <span className={`flex items-center gap-3 ${className}`}>
      <LogoMark className={`h-8 w-auto ${isDark ? "text-white" : "text-anthracite-950"}`} />
      <span className="flex flex-col leading-tight">
        <span
          className={`font-display text-base font-semibold tracking-tight sm:text-lg ${
            isDark ? "text-white" : "text-anthracite-950"
          }`}
        >
          NA Business Africa
        </span>
        {tagline ? (
          <span
            className={`text-[9px] font-semibold uppercase tracking-[0.2em] ${
              isDark ? "text-anthracite-300" : "text-anthracite-500"
            }`}
          >
            Expert en Immobilier
          </span>
        ) : null}
      </span>
    </span>
  );
}
