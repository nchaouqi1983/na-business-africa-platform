/**
 * Minimal, dependency-free RFC4180-ish CSV parser for the property import
 * module (phase 6J1). No external CSV library is installed in this project,
 * and the input files are small (500 data rows max — see MAX_IMPORT_ROWS),
 * so a hand-rolled parser is preferable to adding a dependency for this.
 *
 * Supports: UTF-8 (BOM stripped), comma or semicolon delimiter
 * (auto-detected from the header line), quoted fields with embedded
 * delimiters/newlines, and `""` as an escaped quote inside a quoted field.
 * Does NOT support single-character-escaped quotes (`\"`) — not a real CSV
 * convention and not needed here.
 */

export type ParsedCsv = {
  headers: string[];
  /** One row per data line, each a plain header->value map (values trimmed). Every column in `knownColumns` is always present, even when the file itself never had that header (value ""). */
  rows: { lineNumber: number; values: Record<string, string> }[];
  /** Headers present in the file but outside `knownColumns` — tolerated, values never read, just reported (phase 6J2). */
  ignoredColumns: string[];
};

export class CsvParseError extends Error {}

function detectDelimiter(headerLine: string): "," | ";" {
  const commaCount = (headerLine.match(/,/g) ?? []).length;
  const semicolonCount = (headerLine.match(/;/g) ?? []).length;
  return semicolonCount > commaCount ? ";" : ",";
}

/** Splits raw CSV text into rows of raw string fields, respecting quotes and embedded newlines. */
function tokenize(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;

  while (i < text.length) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      field += char;
      i += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }
    if (char === delimiter) {
      row.push(field);
      field = "";
      i += 1;
      continue;
    }
    if (char === "\r") {
      i += 1;
      continue;
    }
    if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      i += 1;
      continue;
    }
    field += char;
    i += 1;
  }

  // Last line without a trailing newline.
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

/**
 * `knownColumns` is the full documented CSV contract (IMPORT_CSV_COLUMNS) —
 * a header outside that set is tolerated and reported via `ignoredColumns`,
 * never a hard error. `requiredColumns` (a subset of `knownColumns`) must
 * actually be present in the file, or parsing fails outright: without them
 * no row could be validated meaningfully. Every row's `values` map always
 * has an entry for every known column, "" when the file never had that
 * header at all — callers never need an existence check, just a blank read.
 */
export function parseCsv(rawText: string, knownColumns: readonly string[], requiredColumns: readonly string[]): ParsedCsv {
  const text = rawText.charCodeAt(0) === 0xfeff ? rawText.slice(1) : rawText;

  const firstNewline = text.indexOf("\n");
  const headerLine = (firstNewline === -1 ? text : text.slice(0, firstNewline)).replace(/\r$/, "");
  if (!headerLine.trim()) {
    throw new CsvParseError("Le fichier est vide.");
  }
  const delimiter = detectDelimiter(headerLine);

  const allRows = tokenize(text, delimiter).filter((cells) => !(cells.length === 1 && cells[0] === ""));
  if (allRows.length === 0) {
    throw new CsvParseError("Le fichier est vide.");
  }

  const headers = allRows[0].map((h) => h.trim());
  const headerSet = new Set(headers);
  const knownSet = new Set(knownColumns);

  const missing = requiredColumns.filter((h) => !headerSet.has(h));
  if (missing.length > 0) {
    throw new CsvParseError(`Colonnes obligatoires manquantes : ${missing.join(", ")}.`);
  }
  const ignoredColumns = headers.filter((h) => !knownSet.has(h));

  const dataLines = allRows.slice(1);
  const rows = dataLines.map((cells, index) => {
    const values: Record<string, string> = {};
    for (const column of knownColumns) values[column] = "";
    headers.forEach((header, columnIndex) => {
      if (knownSet.has(header)) values[header] = (cells[columnIndex] ?? "").trim();
    });
    return { lineNumber: index + 2, values }; // +2: header is line 1, data starts at line 2
  });

  return { headers, rows, ignoredColumns };
}
