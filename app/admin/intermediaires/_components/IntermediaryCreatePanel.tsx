"use client";

import { useRouter } from "next/navigation";
import { createIntermediary } from "@/lib/real-estate-network/intermediary-actions";
import IntermediaryForm from "./IntermediaryForm";

export default function IntermediaryCreatePanel() {
  const router = useRouter();

  return (
    <details className="rounded-2xl border border-dashed border-anthracite-200 bg-white p-6">
      <summary className="cursor-pointer text-sm font-medium text-anthracite-700">+ Nouvel intermédiaire</summary>
      <div className="mt-4">
        <IntermediaryForm action={createIntermediary} submitLabel="Créer l'intermédiaire" onCreated={() => router.refresh()} />
      </div>
    </details>
  );
}
