import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import Sticker from "../models/Sticker.js";
import Message from "../models/Message.js";
import Scan from "../models/Scan.js";
import User from "../models/User.js";
import { validate } from "../middleware/validate.js";
import { sendMail } from "../lib/mailer.js";

const router = Router();

// Finder messages are rate-limited per IP to prevent spam.
const messageLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many messages. Please try again later." },
});

// --- Public sticker view ---------------------------------------------------
// Returns only what a finder is allowed to see — NEVER the owner's contact.
router.get("/:code", async (req, res, next) => {
  try {
    const sticker = await Sticker.findOne({ code: req.params.code });
    if (!sticker) return res.status(404).json({ error: "Not found", status: "missing" });

    // Log the scan (timestamp + user agent only). Fire and forget; a scan-log
    // failure shouldn't break the page. We also bump the denormalized counter.
    Scan.create({ sticker: sticker._id, userAgent: req.get("user-agent") || "" }).catch(() => {});
    Sticker.updateOne({ _id: sticker._id }, { $inc: { scanCount: 1 } }).catch(() => {});

    // Unclaimed / paused: don't expose any page content.
    if (sticker.status === "unclaimed") {
      return res.json({ status: "unclaimed", code: sticker.code });
    }
    if (sticker.status === "paused") {
      return res.json({ status: "paused", code: sticker.code });
    }

    // active or lost: render the page content.
    res.json({
      status: sticker.status, // "active" | "lost"
      code: sticker.code,
      template: sticker.template,
      page: sticker.page,
    });
  } catch (err) {
    next(err);
  }
});

// --- Finder sends a message ------------------------------------------------
const messageSchema = z.object({
  foundWhere: z.string().max(500).default(""),
  body: z.string().min(1, "Message is required").max(2000),
  finderContact: z.string().max(200).default(""),
});

router.post("/:code/message", messageLimiter, validate(messageSchema), async (req, res, next) => {
  try {
    const sticker = await Sticker.findOne({ code: req.params.code });
    if (!sticker) return res.status(404).json({ error: "Not found" });

    // Only accept messages for pages that are actually live.
    if (!["active", "lost"].includes(sticker.status)) {
      return res.status(400).json({ error: "This page is not accepting messages" });
    }

    const { foundWhere, body, finderContact } = req.body;
    await Message.create({ sticker: sticker._id, foundWhere, body, finderContact });

    // Notify the owner by email (console-logged in dev).
    if (sticker.owner) {
      const owner = await User.findById(sticker.owner);
      if (owner) {
        await sendMail({
          to: owner.email,
          subject: "Someone found your item on Requesto",
          text:
            `Good news — a finder left a message on your sticker (${sticker.code}).\n\n` +
            `Where they found it: ${foundWhere || "(not specified)"}\n` +
            `Message: ${body}\n` +
            `Finder contact: ${finderContact || "(not shared)"}\n\n` +
            `Log in to Requesto to see your messages.`,
        });
      }
    }

    res.status(201).json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
