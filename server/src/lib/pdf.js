import PDFDocument from "pdfkit";
import QRCode from "qrcode";

// PDF layout is in points: 1 cm = 28.35 pt. A4 is 595.28 x 841.89 pt.
const CM = 28.35;
const QR_SIZE = 2.5 * CM; // ~2.5 cm QR, as specified for the printed stickers.

// Render a QR code (encoding the public URL) to a PNG buffer for embedding.
async function qrBuffer(text) {
  return QRCode.toBuffer(text, { margin: 1, width: 300 });
}

// --- Sticker sheet ---------------------------------------------------------
// A4 grid of QR stickers. Under each QR: "If found, scan me" + "requesto.in".
// The claim code deliberately NEVER appears here.
export async function writeStickerSheet(res, items) {
  const doc = new PDFDocument({ size: "A4", margin: 2 * CM });
  doc.pipe(res);

  const cellW = QR_SIZE + 0.6 * CM; // horizontal cell = QR + side padding
  const cellH = QR_SIZE + 1.4 * CM; // vertical cell = QR + text below
  const startX = doc.page.margins.left;
  const startY = doc.page.margins.top;
  const usableW = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const cols = Math.max(1, Math.floor(usableW / cellW));

  let col = 0;
  let y = startY;

  for (const item of items) {
    const buf = await qrBuffer(item.url);
    const x = startX + col * cellW;

    // New page when we run past the bottom margin.
    if (y + cellH > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
      y = startY;
      col = 0;
    }

    const drawX = startX + col * cellW;
    doc.image(buf, drawX, y, { width: QR_SIZE, height: QR_SIZE });
    doc
      .fontSize(8)
      .fillColor("#000")
      .text("If found, scan me", drawX - 0.3 * CM, y + QR_SIZE + 2, {
        width: cellW,
        align: "center",
      })
      .fillColor("#5B4BF5")
      .text("requesto.in", drawX - 0.3 * CM, y + QR_SIZE + 14, {
        width: cellW,
        align: "center",
      });

    col++;
    if (col >= cols) {
      col = 0;
      y += cellH;
    }
    void x;
  }

  doc.end();
}

// --- Combined print labels -------------------------------------------------
// One label per sticker, laid out top-to-bottom as the owner asked:
//   [brand flame + requesto.in]  →  "FOUND ME? SCAN ME"  →  QR  →
//   - - - tear line - - -  →  CLAIM CODE stub
// The buyer activates the sticker, then tears off / discards the claim stub so
// the secret code never stays on the item. Admin controls size + what shows.
const LABEL_SIZES = {
  small: { qrCm: 1.8, cols: 4 },
  medium: { qrCm: 2.5, cols: 3 },
  large: { qrCm: 3.5, cols: 2 },
};

// The Requesto flame, as an SVG path in a 24x24 box (drawn scaled with pdfkit).
const FLAME_PATH =
  "M13.5 0.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67z";

export async function writeLabelSheet(res, items, options = {}) {
  const {
    size = "medium",
    topText = "FOUND ME? SCAN ME",
    showLogo = true,
    showClaim = true,
    accent = "#5B4BF5",
  } = options;

  const conf = LABEL_SIZES[size] || LABEL_SIZES.medium;
  const qrPt = conf.qrCm * CM;

  const doc = new PDFDocument({ size: "A4", margin: 1.2 * CM });
  doc.pipe(res);

  const startX = doc.page.margins.left;
  const startY = doc.page.margins.top;
  const usableW = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const cols = conf.cols;
  const cellW = usableW / cols;
  const pad = 8;

  // Fixed heights for each stacked section, so we can paginate cleanly.
  const logoH = showLogo ? 16 : 0;
  const topH = 14;
  const belowQrH = 12; // the "requesto.in" line under the QR
  const claimH = showClaim ? 52 : 0;
  const cellH = pad + logoH + topH + qrPt + belowQrH + claimH + pad;

  let col = 0;
  let y = startY;

  for (const item of items) {
    if (y + cellH > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
      y = startY;
      col = 0;
    }
    const cx = startX + col * cellW;
    const qrImg = await qrBuffer(item.url);
    drawLabel(doc, item, { cx, y, cellW, cellH, qrPt, pad, logoH, topH, belowQrH, showLogo, showClaim, topText, accent, qrImg });

    col++;
    if (col >= cols) {
      col = 0;
      y += cellH;
    }
  }

  doc.end();
}

function drawLabel(doc, item, o) {
  const { cx, y, cellW, cellH, qrPt, pad, logoH, topH, belowQrH, showLogo, showClaim, topText, accent, qrImg } = o;

  // Light cut-guide border around the whole label.
  doc.roundedRect(cx + 3, y + 3, cellW - 6, cellH - 6, 6).lineWidth(0.5).strokeColor("#e5e5e5").stroke();

  let cy = y + pad;

  if (showLogo) {
    // Flame + "requesto.in", centered as a unit.
    doc.font("Helvetica-Bold").fontSize(9);
    const label = "requesto.in";
    const icon = 11;
    const total = icon + 3 + doc.widthOfString(label);
    const sx = cx + (cellW - total) / 2;
    doc.save().translate(sx, cy).scale(icon / 24).fillColor(accent).path(FLAME_PATH).fill().restore();
    doc.fillColor(accent).text(label, sx + icon + 3, cy + 1, { lineBreak: false });
    cy += logoH;
  }

  // "FOUND ME? SCAN ME"
  doc.font("Helvetica-Bold").fontSize(9).fillColor("#111111").text(topText, cx, cy, { width: cellW, align: "center" });
  cy += topH;

  // QR (encodes the permanent public URL).
  const qx = cx + (cellW - qrPt) / 2;
  doc.image(qrImg, qx, cy, { width: qrPt, height: qrPt });
  cy += qrPt + 2;

  doc.font("Helvetica").fontSize(7).fillColor("#888888").text("requesto.in", cx, cy, { width: cellW, align: "center" });
  cy += belowQrH;

  if (showClaim) {
    // Dashed tear line + the claim-code stub below it.
    const lineY = cy + 2;
    doc.save().dash(3, { space: 2 }).moveTo(cx + pad, lineY).lineTo(cx + cellW - pad, lineY).lineWidth(0.7).strokeColor("#bbbbbb").stroke().undash().restore();

    let sy = lineY + 6;
    doc.font("Helvetica").fontSize(6).fillColor("#999999").text("tear off & keep - activate, then discard", cx, sy, { width: cellW, align: "center" });
    sy += 10;
    doc.font("Helvetica").fontSize(6.5).fillColor("#666666").text("CLAIM CODE", cx, sy, { width: cellW, align: "center" });
    sy += 9;
    doc.font("Courier-Bold").fontSize(11).fillColor("#111111").text(item.claimCode, cx, sy, { width: cellW, align: "center" });
  }
}

// --- Claim-code cards ------------------------------------------------------
// A SEPARATE sheet packed with the stickers. Each card shows the secret claim
// code and short instructions. Never printed on the sticker itself.
export async function writeClaimCards(res, items) {
  const doc = new PDFDocument({ size: "A4", margin: 1.5 * CM });
  doc.pipe(res);

  const usableW = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const cols = 2;
  const cardW = usableW / cols;
  const cardH = 4 * CM;
  const startX = doc.page.margins.left;
  const startY = doc.page.margins.top;

  let col = 0;
  let y = startY;

  for (const item of items) {
    if (y + cardH > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
      y = startY;
      col = 0;
    }

    const x = startX + col * cardW;

    // Card border.
    doc
      .roundedRect(x + 6, y + 6, cardW - 12, cardH - 12, 8)
      .lineWidth(1)
      .strokeColor("#ddd")
      .stroke();

    doc
      .fillColor("#5B4BF5")
      .fontSize(11)
      .text("Requesto — keep this safe", x + 16, y + 18, { width: cardW - 32 });
    doc
      .fillColor("#666")
      .fontSize(8)
      .text("Your secret claim code:", x + 16, y + 38, { width: cardW - 32 });
    doc
      .fillColor("#000")
      .fontSize(18)
      .text(item.claimCode, x + 16, y + 52, { width: cardW - 32 });
    doc
      .fillColor("#666")
      .fontSize(8)
      .text(
        "Go to requesto.in, sign in, and enter this code to activate your sticker. " +
          "Don't share it — anyone with this code can claim the sticker.",
        x + 16,
        y + 80,
        { width: cardW - 32 }
      );

    col++;
    if (col >= cols) {
      col = 0;
      y += cardH;
    }
  }

  doc.end();
}
