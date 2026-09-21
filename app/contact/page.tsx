import type { Metadata } from "next";
import SectionTitle from "@/components/SectionTitle";
import ContactForm from "./_components/ContactForm";

export const metadata: Metadata = {
  title: "Contact | NA Business Africa",
  description: "Contactez l'équipe NA Business Africa pour vos projets d'achat, de vente ou d'investissement.",
};

const contactInfo = [
  { label: "Téléphone", value: "+212 5 00 00 00 00" },
  { label: "Email", value: "contact@na-businessafrica.com" },
  { label: "Bureau", value: "Casablanca, Maroc" },
];

export default function ContactPage() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-12 px-6 py-16 lg:px-8">
      <SectionTitle
        eyebrow="Contact"
        title="Parlons de votre projet immobilier"
        description="Notre équipe vous répond sous 24h ouvrées pour toute demande d'achat, de vente ou d'investissement."
      />

      <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr]">
        <div className="flex flex-col gap-6">
          {contactInfo.map((item) => (
            <div key={item.label} className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-gold-600">
                {item.label}
              </span>
              <span className="text-sm text-anthracite-700">{item.value}</span>
            </div>
          ))}
        </div>

        <ContactForm />
      </div>
    </div>
  );
}
