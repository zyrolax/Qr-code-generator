import { Router } from "express";
import Message from "../models/Message.js";
import Sticker from "../models/Sticker.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

// Mark a finder message as read. We check that the message's sticker belongs
// to the current user before allowing it.
router.patch("/:id/read", async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ error: "Not found" });

    const sticker = await Sticker.findOne({ _id: message.sticker, owner: req.user._id });
    if (!sticker) return res.status(404).json({ error: "Not found" });

    message.read = true;
    await message.save();
    res.json({ message });
  } catch (err) {
    next(err);
  }
});

export default router;
