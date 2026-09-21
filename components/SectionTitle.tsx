type SectionTitleProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  tone?: "light" | "dark";
};

export default function SectionTitle({
  eyebrow,
  title,
  description,
  align = "left",
  tone = "light",
}: SectionTitleProps) {
  const alignment = align === "center" ? "items-center text-center mx-auto" : "items-start text-left";
  const titleColor = tone === "dark" ? "text-white" : "text-anthracite-950";
  const descriptionColor = tone === "dark" ? "text-anthracite-200" : "text-anthracite-500";

  return (
    <div className={`flex max-w-2xl flex-col gap-3 ${alignment}`}>
      {eyebrow ? (
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-600">
          {eyebrow}
        </span>
      ) : null}
      <h2 className={`font-display text-3xl font-semibold sm:text-4xl ${titleColor}`}>
        {title}
      </h2>
      {description ? (
        <p className={`text-base leading-relaxed ${descriptionColor}`}>{description}</p>
      ) : null}
    </div>
  );
}
