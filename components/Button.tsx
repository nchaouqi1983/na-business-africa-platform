import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

type SharedProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
};

type LinkProps = SharedProps & {
  href: string;
  external?: boolean;
};

type NativeButtonProps = SharedProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> & {
    href?: undefined;
  };

type ButtonProps = LinkProps | NativeButtonProps;

const variantStyles: Record<Variant, string> = {
  primary: "bg-gold-500 text-anthracite-950 hover:bg-gold-400",
  secondary:
    "border border-anthracite-700 text-anthracite-50 hover:border-gold-500 hover:text-gold-400",
  ghost: "text-anthracite-900 hover:text-gold-600",
};

const sizeStyles: Record<Size, string> = {
  sm: "px-4 py-2 text-xs",
  md: "px-6 py-3 text-sm",
  lg: "px-8 py-4 text-sm",
};

export default function Button(props: ButtonProps) {
  const { variant = "primary", size = "md", className = "", children } = props;

  const classes = [
    "inline-flex items-center justify-center gap-2 rounded-full font-medium uppercase tracking-wider",
    "transition-colors duration-200 whitespace-nowrap",
    sizeStyles[size],
    variantStyles[variant],
    className,
  ].join(" ");

  if (props.href) {
    const { href, external } = props;
    if (external) {
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" className={classes}>
          {children}
        </a>
      );
    }
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  const rest = { ...(props as NativeButtonProps) };
  delete rest.href;
  delete rest.variant;
  delete rest.size;
  delete rest.className;
  delete rest.children;

  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  );
}
