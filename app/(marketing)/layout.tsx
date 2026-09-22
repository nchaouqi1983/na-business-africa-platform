import type { ReactNode } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

/**
 * Public marketing chrome (Header/Footer) — scoped to this route group only
 * so it never leaks into /admin or /connexion, which get their own sober
 * back-office chrome (see app/admin/layout.tsx). A route group's parentheses
 * don't add a URL segment, so every page here keeps its existing path.
 */
export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
