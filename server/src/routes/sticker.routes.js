import { Router } from "express";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import Sticker from "../models/Sticker.js";
import Message from "../models/Message.js";
import { validate } from "../middleware/validate.js";
import { requireAuth } from "../middleware/auth.js";
import { normalizeClaimCode } from "../lib/codes.js";
import { blocksSchema, styleSchema } from "../lib/blocks.js";

const router = Router();

// Everything in this file requires a logged-in owner.
router.use(requireAuth);

// Slow down brute-forcing of claim codes.
const claimLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many claim attempts. Try again later." },
});

// --- Claim a sticker -------------------------------------------------------
const claimSchema = z.object({ claimCode: z.string().min(1) });

router.post("/claim", claimLimiter, validate(claimSchema), async (req, res, next) => {
  try {
    const claimCode = normalizeClaimCode(req.body.claimCode);

    // We hash the claim code, so we can't query by it directly. Instead we
    // compare against the unclaimed stickers. For a student-scale project this
    // is fine; at large scale you'd add an indexed lookup key.
    const candidates = await Sticker.find({ status: "unclaimed" });
    let matched = null;
    for (const s of candidates) {
      if (await bcrypt.compare(claimCode, s.claimCodeHash)) {
        matched = s;
        break;
      }
    }

    if (!matched) return res.status(404).json({ error: "Invalid or already-used claim code" });

    matched.owner = req.user._id;
    matched.status = "active";
    matched.template = "lost_found";
    await matched.save();

    res.json({ sticker: matched });
  } catch (err) {
    next(err);
  }
});

// --- List my stickers ------------------------------------------------------
router.get("/", async (req, res, next) => {
  try {
    const stickers = await Sticker.find({ owner: req.user._id }).sort({ updatedAt: -1 });

    // Attach message + unread counts in one aggregation so the dashboard can
    // show an inbox badge without N extra queries.
    const ids = stickers.map((s) => s._id);
    const counts = await Message.aggregate([
      { $match: { sticker: { $in: ids } } },
      {
        $group: {
          _id: "$sticker",
          total: { $sum: 1 },
          unread: { $sum: { $cond: ["$read", 0, 1] } },
        },
      },
    ]);
    const byId = new Map(counts.map((c) => [String(c._id), c]));

    const withCounts = stickers.map((s) => ({
      ...s.toJSON(),
      messageCount: byId.get(String(s._id))?.total || 0,
      unreadCount: byId.get(String(s._id))?.unread || 0,
    }));

    res.json({ stickers: withCounts });
  } catch (err) {
    next(err);
  }
});

// Helper: load a sticker that belongs to the current user, or 404.
async function ownedSticker(req) {
  return Sticker.findOne({ _id: req.params.id, owner: req.user._id });
}

// --- Fetch one of my stickers ---------------------------------------------
router.get("/:id", async (req, res, next) => {
  try {
    const sticker = await ownedSticker(req);
    if (!sticker) return res.status(404).json({ error: "Not found" });
    res.json({ sticker });
  } catch (err) {
    next(err);
  }
});

// --- Toggle active / paused ------------------------------------------------
const statusSchema = z.object({ status: z.enum(["active", "paused"]) });

router.patch("/:id/status", validate(statusSchema), async (req, res, next) => {
  try {
    const sticker = await ownedSticker(req);
    if (!sticker) return res.status(404).json({ error: "Not found" });
    if (sticker.status === "unclaimed") {
      return res.status(400).json({ error: "Claim the sticker first" });
    }

    // Changing active/paused shouldn't silently clear lost mode; but lost is a
    // separate switch, so only move between active and paused here.
    sticker.status = req.body.status;
    await sticker.save();
    res.json({ sticker });
  } catch (err) {
    next(err);
  }
});

// --- Lost mode on / off ----------------------------------------------------
const lostSchema = z.object({ lost: z.boolean() });

router.patch("/:id/lost", validate(lostSchema), async (req, res, next) => {
  try {
    const sticker = await ownedSticker(req);
    if (!sticker) return res.status(404).json({ error: "Not found" });
    if (sticker.status === "unclaimed") {
      return res.status(400).json({ error: "Claim the sticker first" });
    }

    // Turning lost mode off returns the sticker to active.
    sticker.status = req.body.lost ? "lost" : "active";
    await sticker.save();
    res.json({ sticker });
  } catch (err) {
    next(err);
  }
});

// --- Edit page content -----------------------------------------------------
// The block-based editor sends `blocks`. The legacy fixed fields remain
// optional so older clients / seed data keep working.
const pageSchema = z.object({
  template: z.enum(["lost_found", "links"]),
  title: z.string().max(120).default(""),
  description: z.string().max(2000).default(""),
  imageUrl: z.string().url().max(2000).or(z.literal("")).default(""),
  note: z.string().max(2000).default(""),
  links: z
    .array(
      z.object({
        label: z.string().max(80).default(""),
        url: z.string().url().max(2000).or(z.literal("")).default(""),
      })
    )
    .max(20)
    .default([]),
  blocks: blocksSchema,
  style: styleSchema,
});

router.put("/:id/page", validate(pageSchema), async (req, res, next) => {
  try {
    const sticker = await ownedSticker(req);
    if (!sticker) return res.status(404).json({ error: "Not found" });

    const { template, title, description, imageUrl, note, links, blocks, style } = req.body;
    sticker.template = template;
    sticker.page = { title, description, imageUrl, note, links, blocks, style };
    await sticker.save();
    res.json({ sticker });
  } catch (err) {
    next(err);
  }
});

// --- Messages inbox for one sticker ---------------------------------------
router.get("/:id/messages", async (req, res, next) => {
  try {
    const sticker = await ownedSticker(req);
    if (!sticker) return res.status(404).json({ error: "Not found" });

    const messages = await Message.find({ sticker: sticker._id }).sort({ createdAt: -1 });
    res.json({ messages });
  } catch (err) {
    next(err);
  }
});

export default router;
