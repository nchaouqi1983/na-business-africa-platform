import sharp from "sharp";

/**
 * Generates safe, synthetic "photos" for the demo catalogue: flat
 * architectural illustrations rendered from an inline SVG by sharp — no
 * download, no third-party image, no real place or person. Output is a JPEG
 * master plus the same four WebP variants lib/media/image-processing.ts
 * produces for a real upload.
 */

const WIDTH = 1600;
const HEIGHT = 1067;

export const MEDIA_VARIANT_WIDTHS = { thumb: 480, card: 768, gallery: 1440, large: 2400 } as const;
export type MediaVariant = keyof typeof MEDIA_VARIANT_WIDTHS;

type Scene = "exterior" | "interior" | "view";

function windowsGrid(x: number, y: number, cols: number, rows: number, w: number, h: number, gap: number, fill: string): string {
  let out = "";
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      out += `<rect x="${x + c * (w + gap)}" y="${y + r * (h + gap)}" width="${w}" height="${h}" rx="4" fill="${fill}"/>`;
    }
  }
  return out;
}

function palm(x: number, ground: number, scale: number, color: string): string {
  const top = ground - 320 * scale;
  const leaves = [-70, -35, 0, 35, 70]
    .map((angle) => `<ellipse cx="${x}" cy="${top}" rx="${110 * scale}" ry="${22 * scale}" fill="${color}" transform="rotate(${angle} ${x} ${top}) translate(${60 * scale} 0)"/>`)
    .join("");
  return `<path d="M${x - 8 * scale} ${ground} Q${x + 30 * scale} ${ground - 160 * scale} ${x} ${top}" stroke="#6b4f2a" stroke-width="${14 * scale}" fill="none"/>${leaves}`;
}

function building(kind: string, accent: string, dark: string, ground: number): string {
  switch (kind) {
    case "APPARTEMENT":
    case "PROGRAMME_NEUF":
      return `<rect x="520" y="${ground - 620}" width="420" height="620" fill="#f8f9fa"/>
        <rect x="940" y="${ground - 480}" width="300" height="480" fill="#e9ecef"/>
        ${windowsGrid(560, ground - 580, 5, 8, 52, 44, 26, accent)}
        ${windowsGrid(975, ground - 440, 3, 6, 56, 44, 30, dark)}
        <rect x="520" y="${ground - 640}" width="420" height="20" fill="${dark}"/>`;
    case "RIAD":
      return `<rect x="420" y="${ground - 460}" width="760" height="460" fill="#e8a87c"/>
        ${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => `<rect x="${420 + i * 78}" y="${ground - 490}" width="44" height="34" fill="#e8a87c"/>`).join("")}
        <path d="M720 ${ground} V${ground - 200} a80 80 0 0 1 160 0 V${ground} Z" fill="${dark}"/>
        <path d="M500 ${ground - 250} v-80 a40 40 0 0 1 80 0 v80 Z" fill="${accent}"/>
        <path d="M1020 ${ground - 250} v-80 a40 40 0 0 1 80 0 v80 Z" fill="${accent}"/>`;
    case "BUREAU":
    case "COMMERCE":
      return `<rect x="560" y="${ground - 700}" width="520" height="700" fill="${dark}"/>
        ${windowsGrid(590, ground - 670, 6, 11, 62, 42, 16, "#9ecbe6")}
        <rect x="560" y="${ground - 90}" width="520" height="90" fill="${accent}"/>`;
    case "TERRAIN":
      return `<path d="M0 ${ground - 120} Q400 ${ground - 260} 800 ${ground - 150} T1600 ${ground - 170} V${ground} H0 Z" fill="${accent}" opacity="0.7"/>`;
    default:
      return `<rect x="380" y="${ground - 330}" width="560" height="330" fill="#fdfcf9"/>
        <rect x="940" y="${ground - 230}" width="360" height="230" fill="#f1ede4"/>
        <rect x="360" y="${ground - 350}" width="600" height="24" fill="${dark}"/>
        <rect x="920" y="${ground - 250}" width="400" height="22" fill="${dark}"/>
        ${windowsGrid(420, ground - 290, 3, 1, 140, 170, 30, "#9ecbe6")}
        ${windowsGrid(980, ground - 200, 2, 1, 130, 150, 30, "#9ecbe6")}
        <rect x="300" y="${ground + 30}" width="700" height="90" rx="10" fill="${accent}"/>`;
  }
}

function sceneSvg(propertyType: string, palette: [string, string, string], scene: Scene): string {
  const [sky, warm, accent] = palette;
  const ground = 800;
  let body: string;

  if (scene === "interior") {
    body = `<rect width="${WIDTH}" height="${HEIGHT}" fill="#f5f0e8"/>
      <rect x="0" y="780" width="${WIDTH}" height="${HEIGHT - 780}" fill="#d9c7a8"/>
      <rect x="880" y="160" width="560" height="480" fill="${sky}"/>
      <rect x="880" y="160" width="560" height="480" fill="none" stroke="#ffffff" stroke-width="18"/>
      <line x1="1160" y1="160" x2="1160" y2="640" stroke="#ffffff" stroke-width="12"/>
      <rect x="180" y="600" width="560" height="190" rx="30" fill="${accent}"/>
      <rect x="160" y="520" width="600" height="110" rx="40" fill="${accent}" opacity="0.85"/>
      <rect x="330" y="820" width="340" height="30" rx="12" fill="#8d6e4c"/>
      <circle cx="1240" cy="760" r="60" fill="${warm}"/>
      <rect x="1225" y="760" width="30" height="120" fill="#8d6e4c"/>`;
  } else if (scene === "view") {
    body = `<defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky}"/><stop offset="1" stop-color="#ffffff"/></linearGradient></defs>
      <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#s)"/>
      <circle cx="1220" cy="330" r="110" fill="${warm}" opacity="0.9"/>
      <rect x="0" y="560" width="${WIDTH}" height="200" fill="${accent}" opacity="0.75"/>
      <rect x="0" y="760" width="${WIDTH}" height="${HEIGHT - 760}" fill="#efe6d8"/>
      <rect x="120" y="820" width="900" height="140" rx="16" fill="#4cc9f0" opacity="0.8"/>
      ${palm(1300, 900, 1, "#2d6a4f")}`;
  } else {
    body = `<defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky}"/><stop offset="1" stop-color="#ffffff"/></linearGradient></defs>
      <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#s)"/>
      <circle cx="260" cy="220" r="90" fill="${warm}" opacity="0.9"/>
      <rect x="0" y="${ground}" width="${WIDTH}" height="${HEIGHT - ground}" fill="#cdb891"/>
      ${building(propertyType, accent, "#3d405b", ground)}
      ${palm(200, ground + 40, 0.9, "#2d6a4f")}
      ${palm(1420, ground + 40, 1.1, "#40916c")}`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">${body}</svg>`;
}

const SCENES: Scene[] = ["exterior", "interior", "view"];

export async function renderDemoImage(
  propertyType: string,
  palette: [string, string, string],
  index: number
): Promise<{ master: Buffer; width: number; height: number; variants: Record<MediaVariant, Buffer> }> {
  const svg = Buffer.from(sceneSvg(propertyType, palette, SCENES[index % SCENES.length]));
  const master = await sharp(svg).jpeg({ quality: 86 }).toBuffer();

  const variants = {} as Record<MediaVariant, Buffer>;
  for (const [variant, width] of Object.entries(MEDIA_VARIANT_WIDTHS) as [MediaVariant, number][]) {
    variants[variant] = await sharp(master).resize({ width, withoutEnlargement: true, fit: "inside" }).webp({ quality: 82 }).toBuffer();
  }
  return { master, width: WIDTH, height: HEIGHT, variants };
}
