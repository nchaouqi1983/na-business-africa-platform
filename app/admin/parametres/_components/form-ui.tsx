/**
 * Same look as FormField's inputClass, but disabled fields keep a dark,
 * readable text color — read-only users must still be able to read every
 * value comfortably.
 */
export const settingsInputClass =
  "w-full min-w-0 rounded-xl border border-anthracite-200 bg-white px-3 py-2.5 text-sm text-anthracite-900 outline-none transition-colors focus:border-gold-500 focus-visible:ring-2 focus-visible:ring-gold-400 disabled:cursor-not-allowed disabled:border-anthracite-100 disabled:bg-anthracite-50 disabled:text-anthracite-700";

export function FormMessage({ error, success }: { error?: string; success?: string }) {
  if (error) {
    return (
      <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
        {error}
      </p>
    );
  }
  if (success) {
    return (
      <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800" role="status">
        {success}
      </p>
    );
  }
  return null;
}
