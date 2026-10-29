import { Router } from "express";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import User from "../models/User.js";
import { validate } from "../middleware/validate.js";
import {
  requireAuth,
  signToken,
  setAuthCookie,
  clearAuthCookie,
} from "../middleware/auth.js";

const router = Router();

// Limit login attempts to slow down password guessing.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts. Try again later." },
});

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

router.post("/signup", loginLimiter, validate(credentialsSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, passwordHash });

    setAuthCookie(res, signToken(user));
    res.status(201).json({ user });
  } catch (err) {
    next(err);
  }
});

router.post("/login", loginLimiter, validate(credentialsSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    // Same generic message whether the email or password is wrong.
    const ok = user && (await bcrypt.compare(password, user.passwordHash));
    if (!ok) return res.status(401).json({ error: "Invalid email or password" });

    setAuthCookie(res, signToken(user));
    res.json({ user });
  } catch (err) {
    next(err);
  }
});

router.post("/logout", (_req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

router.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

export default router;
