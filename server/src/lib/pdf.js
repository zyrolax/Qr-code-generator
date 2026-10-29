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
