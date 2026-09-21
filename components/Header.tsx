"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import Button from "@/components/Button";
import BrandLockup from "@/components/Logo";

const navLinks = [
  { href: "/explorer", label: "Explorer" },
  { href: "/acheter", label: "Acheter" },
  { href: "/vendre", label: "Vendre" },
  { href: "/investir", label: "Investir" },
  { href: "/off-market", label: "Off-market" },
  { href: "/villes", label: "Villes" },
  { href: "/a-propos", label: "À propos" },
];

export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm">
      <div className="hidden border-b border-anthracite-800 bg-anthracite-950 text-anthracite-300 lg:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-2 text-xs lg:px-8">
          <div className="flex items-center gap-4">
            <a href="tel:+212616176871" className="transition-colors hover:text-gold-400">
              +212 6 16 17 68 71
            </a>
            <span className="text-anthracite-600" aria-hidden="true">
              ·
            </span>
            <a
              href="https://wa.me/212616176871"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-gold-400"
            >
              WhatsApp
            </a>
          </div>
          <span className="tracking-[0.2em] text-anthracite-500">MA · FR</span>
        </div>
      </div>

      <div className="border-b border-anthracite-100">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
          <Link href="/" onClick={() => setOpen(false)}>
            <BrandLockup />
          </Link>

          <nav className="hidden items-center gap-8 lg:flex">
            {navLinks.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={[
                    "text-sm font-medium tracking-wide transition-colors",
                    active ? "text-gold-600" : "text-anthracite-700 hover:text-gold-600",
                  ].join(" ")}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden lg:block">
            <Button href="/contact" size="sm">
              Nous contacter
            </Button>
          </div>

          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            aria-expanded={open}
            aria-label="Ouvrir le menu"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-anthracite-200 text-anthracite-900 lg:hidden"
          >
            <span className="sr-only">Menu</span>
            {open ? (
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-anthracite-100 bg-white px-6 py-4 lg:hidden">
          <nav className="flex flex-col gap-4">
            {navLinks.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={[
                    "text-sm font-medium tracking-wide",
                    active ? "text-gold-600" : "text-anthracite-700",
                  ].join(" ")}
                >
                  {link.label}
                </Link>
              );
            })}
            <Button href="/contact" size="sm" className="mt-2 w-full">
              Nous contacter
            </Button>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
