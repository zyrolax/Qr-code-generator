import jwt from "jsonwebtoken";
import User from "../models/User.js";

const COOKIE_NAME = "token";

// Build the httpOnly cookie options. sameSite 'lax' is fine because the client
// and API share a site in dev (localhost) and under the same domain in prod.
export function cookieOptions() {
  const days = Number(process.env.JWT_EXPIRES_DAYS || 7);
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: days * 24 * 60 * 60 * 1000,
  };
}

export function signToken(user) {
  const days = Number(process.env.JWT_EXPIRES_DAYS || 7);
  return jwt.sign({ sub: user._id.toString(), role: user.role }, process.env.JWT_SECRET, {
    expiresIn: `${days}d`,
  });
}

export function setAuthCookie(res, token) {
  res.cookie(COOKIE_NAME, token, cookieOptions());
}

export function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME, { ...cookieOptions(), maxAge: undefined });
}

// Loads the user from the JWT cookie and attaches it to req.user. Rejects if
// missing/invalid. requireAdmin additionally checks the role.
export async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.[COOKIE_NAME];
    if (!token) return res.status(401).json({ error: "Not logged in" });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub);
    if (!user) return res.status(401).json({ error: "Not logged in" });

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: "Not logged in" });
  }
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Admin only" });
  }
  next();
}
