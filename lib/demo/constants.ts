/**
 * Local demo dataset markers (see prisma/demo/). Dependency-free so both the
 * tsx seed/clear scripts and the admin layout can import it.
 *
 * Every demo row gets a deterministic id starting with DEMO_ID_PREFIX (that is
 * what makes `pnpm db:seed:demo` idempotent and `pnpm db:clear:demo` safe),
 * plus a human-visible DEMO_TAG wherever the model has a source/notes field:
 * Property.importSource, PropertyPrivate.source, internalNotes/notes, and a
 * "DEMO" segment in every business reference (NHA-DEMO-000001, PRO-DEMO-…).
 */
export const DEMO_TAG = "DEMO_NA";
export const DEMO_ID_PREFIX = "demona-";
export const DEMO_EMAIL_DOMAIN = "example.test";
