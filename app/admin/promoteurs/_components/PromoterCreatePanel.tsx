"use client";

import { useRouter } from "next/navigation";
import { createPromoter } from "@/lib/real-estate-network/promoter-actions";
import PromoterForm from "./PromoterForm";

export default function PromoterCreatePanel() {
  const router = useRouter();

  return (
    <details className="rounded-2xl border border-dashed border-anthracite-200 bg-white p-6">
      <summary className="cursor-pointer text-sm font-medium text-anthracite-700">+ Nouveau promoteur</summary>
      <div className="mt-4">
        <PromoterForm action={createPromoter} submitLabel="Créer le promoteur" onCreated={() => router.refresh()} />
      </div>
    </details>
  );
}
