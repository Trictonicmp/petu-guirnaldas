import * as opentype from "opentype.js";
import { colors } from "../domain/colors/colors";
import { getDesign } from "../domain/designs/designs";
import type { GarlandItem, GarlandSlot } from "../domain/garland/types";
import { getBanderinSvg, otherVariantSvg } from "./assets";

const FONT_URL = "/assets/fonts/Guirnaldas-font.ttf";

// Medidas estándar (mm) de los banderines de siluetas; las bases "nombre", "formabase", etc. se ajustan a ellas.
const STANDARD_SIZE_MM = {
  "semi-circle": { width: 165, height: 185.035 },
  rectangle: { width: 184.468, height: 144.85 },
} as const;
const encoder = new TextEncoder();

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`No se pudo cargar ${url}`);
  return response.text();
}

async function loadFont(): Promise<opentype.Font> {
  const response = await fetch(FONT_URL);
  if (!response.ok) throw new Error("No se pudo cargar la tipografía");
  return opentype.parse(await response.arrayBuffer());
}

// Extrae solo los paths y les pone el relleno directo, sin <style> ni clases (más compatible con CorelDRAW).
function parseSvg(svg: string, fill: string) {
  const viewBox = /viewBox="([^"]+)"/.exec(svg)?.[1] ?? "0 0 100 100";
  const [, , width, height] = viewBox.split(/\s+/).map(Number);
  const paths = [...svg.matchAll(/<path\b[^>]*\bd="([^"]+)"[^>]*\/?>/g)].map(
    (match) => `<path fill="${fill}" fill-rule="evenodd" d="${match[1]}"/>`,
  );
  return {
    viewBox,
    width,
    height,
    inner: paths.join(""),
  };
}

function textPath(
  font: opentype.Font,
  text: string,
  cx: number,
  cy: number,
  maxWidth: number,
  maxSize: number,
): string {
  const probe = font.getPath(text, 0, 0, maxSize).getBoundingBox();
  const size = Math.min(
    maxSize,
    (maxSize * maxWidth) / Math.max(probe.x2 - probe.x1, 1),
  );
  const box = font.getPath(text, 0, 0, size).getBoundingBox();
  const x = cx - (box.x1 + box.x2) / 2;
  const y = cy - (box.y1 + box.y2) / 2;
  const d = font.getPath(text, x, y, size).toPathData(3);
  return `<path fill="#ffffff" fill-rule="evenodd" d="${d}"/>`;
}

function buildBanderinSvg(
  item: GarlandItem,
  color: string,
  base: string,
  variant: string,
  font: opentype.Font | undefined,
): string {
  const art = parseSvg(base, color);
  const { width: w, height: h } = art;
  const name = item.customization?.name?.trim() ?? "";
  const parts: string[] = [art.inner];

  if (item.designId === "otro") {
    const insetX = (item.shape === "rectangle" ? 0.12 : 0.14) * w;
    const top = 0.14 * h;
    const boxW = w - insetX * 2;
    const boxH = h - top - 0.18 * h;
    const nameH = name ? Math.min(boxH * 0.3, 0.09 * w * 2) : 0;
    const gap = name ? 0.05 * w : 0;
    const v = parseSvg(variant, "#ffffff");
    const availH = boxH - nameH - gap;
    const scale = Math.min(boxW / v.width, availH / v.height);
    const tx = insetX + (boxW - v.width * scale) / 2;
    const ty = top + (availH - v.height * scale) / 2;
    parts.push(
      `<g transform="translate(${tx} ${ty}) scale(${scale})">${v.inner}</g>`,
    );
    if (name && font)
      parts.push(
        textPath(
          font,
          name,
          w / 2,
          top + boxH - nameH / 2,
          0.9 * w,
          0.09 * w * 1.6,
        ),
      );
  } else if (name && font) {
    const cy = (item.shape === "semi-circle" ? 0.25 : 0.4) * h;
    parts.push(textPath(font, name, w / 2, cy, 0.88 * w, 0.24 * w));
  }

  const standard = STANDARD_SIZE_MM[item.shape];
  const size = ` width="${standard.width}mm" height="${standard.height}mm"`;
  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" version="1.1"${size} viewBox="${art.viewBox}">${parts.join("")}</svg>\n`;
}

let crcTable: Uint32Array | undefined;
function crc32(data: Uint8Array): number {
  if (!crcTable) {
    crcTable = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      crcTable[n] = c >>> 0;
    }
  }
  let crc = 0xffffffff;
  for (const byte of data) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

// ZIP sin compresión (método "store"), suficiente para unos pocos SVG.
function createZip(files: { name: string; data: Uint8Array }[]): Blob {
  const chunks: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;
  for (const file of files) {
    const name = encoder.encode(file.name);
    const crc = crc32(file.data);
    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(4, 20, true);
    local.setUint16(6, 0x0800, true);
    local.setUint32(14, crc, true);
    local.setUint32(18, file.data.length, true);
    local.setUint32(22, file.data.length, true);
    local.setUint16(26, name.length, true);
    chunks.push(new Uint8Array(local.buffer), name, file.data);

    const entry = new DataView(new ArrayBuffer(46));
    entry.setUint32(0, 0x02014b50, true);
    entry.setUint16(4, 20, true);
    entry.setUint16(6, 20, true);
    entry.setUint16(8, 0x0800, true);
    entry.setUint32(16, crc, true);
    entry.setUint32(20, file.data.length, true);
    entry.setUint32(24, file.data.length, true);
    entry.setUint16(28, name.length, true);
    entry.setUint32(42, offset, true);
    central.push(new Uint8Array(entry.buffer), name);
    offset += 30 + name.length + file.data.length;
  }
  const centralSize = central.reduce((sum, part) => sum + part.length, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, files.length, true);
  end.setUint16(10, files.length, true);
  end.setUint32(12, centralSize, true);
  end.setUint32(16, offset, true);
  return new Blob(
    [...chunks, ...central, new Uint8Array(end.buffer)] as BlobPart[],
    { type: "application/zip" },
  );
}

const slug = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

export async function downloadGarlandZip(
  slots: GarlandSlot[],
  orderNumber: string,
): Promise<number> {
  const entries = slots.flatMap((item, index) =>
    item ? [{ item, index }] : [],
  );
  if (entries.length === 0) return 0;

  const needsFont = entries.some(({ item }) =>
    item.customization?.name?.trim(),
  );
  const [font, variant] = await Promise.all([
    needsFont ? loadFont() : Promise.resolve(undefined),
    entries.some(({ item }) => item.designId === "otro")
      ? fetchText(otherVariantSvg)
      : Promise.resolve(""),
  ]);

  const files: { name: string; data: Uint8Array }[] = [];
  const summary: string[] = [`Pedido: ${orderNumber}`, ""];
  for (const { item, index } of entries) {
    const color = colors.find((c) => c.id === item.colorId);
    const designName = getDesign(item.designId)?.name ?? item.designId;
    const base = await fetchText(getBanderinSvg(item.shape, item.designId));
    const svg = buildBanderinSvg(
      item,
      color?.value ?? "#999999",
      base,
      variant,
      font,
    );
    const fileName = `${String(index + 1).padStart(2, "0")}-${slug(designName)}-${item.colorId}.svg`;
    files.push({ name: fileName, data: encoder.encode(svg) });
    const name = item.customization?.name?.trim();
    summary.push(
      `${index + 1}. ${designName} | ${item.shape === "semi-circle" ? "Semicírculo" : "Rectángulo"} | ${color?.name ?? item.colorId}${name ? ` | Nombre: ${name}` : ""}`,
    );
  }
  files.push({
    name: "resumen.txt",
    data: encoder.encode(summary.join("\n") + "\n"),
  });

  const url = URL.createObjectURL(createZip(files));
  const link = document.createElement("a");
  link.href = url;
  link.download = `pedido - ${orderNumber.trim().replace(/^#/, "").replace(/[\\/:*?"<>|]+/g, "-")}.zip`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return entries.length;
}
