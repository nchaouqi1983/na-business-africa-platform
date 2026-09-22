import type { Prisma } from "@/lib/generated/prisma/client";

const madFormatter = new Intl.NumberFormat("fr-MA", {
  style: "currency",
  currency: "MAD",
  maximumFractionDigits: 0,
});

const dateTimeFormatter = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function formatPrice(price: Prisma.Decimal | number | null, priceOnRequest: boolean): string {
  if (priceOnRequest) return "Prix sur demande";
  if (price === null) return "—";
  return madFormatter.format(Number(price));
}

/** Plain MAD-formatted amount, for finance-module figures with no "price on request" concept. */
export function madAmount(value: Prisma.Decimal | number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return madFormatter.format(Number(value));
}

export function formatDateTime(date: Date): string {
  return dateTimeFormatter.format(date);
}
