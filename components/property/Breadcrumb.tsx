import Link from "next/link";

type BreadcrumbItem = {
  label: string;
  href?: string;
};

type BreadcrumbProps = {
  items: BreadcrumbItem[];
  tone?: "light" | "dark";
};

export default function Breadcrumb({ items, tone = "light" }: BreadcrumbProps) {
  const isDark = tone === "dark";

  return (
    <nav aria-label="Fil d'Ariane" className="overflow-x-auto">
      <ol className="flex items-center gap-2 whitespace-nowrap text-xs text-anthracite-400">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={item.label} className="flex items-center gap-2">
              {index > 0 && (
                <span aria-hidden="true" className={isDark ? "text-anthracite-600" : "text-anthracite-300"}>
                  /
                </span>
              )}
              {item.href && !isLast ? (
                <Link href={item.href} className="transition-colors hover:text-gold-500">
                  {item.label}
                </Link>
              ) : (
                <span className={isLast ? `font-medium ${isDark ? "text-anthracite-200" : "text-anthracite-600"}` : undefined}>
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
