import { Router } from "express";
import { z } from "zod";
import Sticker from "../models/Sticker.js";
import { validate } from "../middleware/validate.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { createStickerBatch } from "../lib/stickers.js";
import { publicUrlFor } from "../lib/codes.js";
import { writeStickerSheet, writeClaimCards } from "../lib/pdf.js";

const router = Router();
router.use(requireAuth, requireAdmin);

// --- Generate a batch ------------------------------------------------------
// Returns the plaintext claim codes ONCE. They are bcrypt-hashed in the DB and
// can never be retrieved again, so the admin must save the CSV/cards now.
const batchSchema = z.object({ count: z.number().int().min(1).max(500) });

router.post("/stickers/batch", validate(batchSchema), async (req, res, next) => {
  try {
    const { batchId, items } = await createStickerBatch(req.body.count);
    res.status(201).json({
      batchId,
      items: items.map((i) => ({ code: i.code, claimCode: i.claimCode, url: i.url })),
    });
  } catch (err) {
    next(err);
  }
});

// --- Printable QR sticker sheet (PDF) --------------------------------------
// Needs only code + URL, which live in the DB, so this works any time by
// batchId. The claim code never appears on this sheet.
router.get("/stickers/batch/:batchId/stickers.pdf", async (req, res, next) => {
  try {
    const stickers = await Sticker.find({ batchId: req.params.batchId });
    if (stickers.length === 0) return res.status(404).json({ error: "Batch not found" });

    const items = stickers.map((s) => ({ code: s.code, url: publicUrlFor(s.code) }));
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="stickers-${req.params.batchId}.pdf"`);
    await writeStickerSheet(res, items);
  } catch (err) {
    next(err);
  }
});

// --- Printable claim-code cards (PDF) --------------------------------------
// Claim codes are only available right after creation, so the client posts the
// batch result back here to render the cards. (We can't regenerate them.)
const cardsSchema = z.object({
  items: z
    .array(z.object({ claimCode: z.string().min(1), code: z.string().optional() }))
    .min(1)
    .max(500),
});

router.post("/stickers/batch/cards.pdf", validate(cardsSchema), async (req, res, next) => {
  try {
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'attachment; filename="claim-cards.pdf"');
    await writeClaimCards(res, req.body.items);
  } catch (err) {
    next(err);
  }
});

// --- Admin list of all stickers -------------------------------------------
router.get("/stickers", async (_req, res, next) => {
  try {
    const stickers = await Sticker.find()
      .sort({ createdAt: -1 })
      .populate("owner", "email")
      .limit(1000);
    res.json({ stickers });
  } catch (err) {
    next(err);
  }
});

export default router;
