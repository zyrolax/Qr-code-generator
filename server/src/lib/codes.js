import crypto from "crypto";

// Public code alphabet: no 0/O, 1/l/I — avoids confusion when typed from a
// printed sticker. All lowercase so it's easy to read and type on mobile.
const PUBLIC_ALPHABET = "23456789abcdefghjkmnpqrstuvwxyz";
const PUBLIC_LEN = 6;

// Claim code alphabet: uppercase + digits, also unambiguous. Format RQ-XXXX-XXXX.
const CLAIM_ALPHABET = "234679ACDEFGHJKLMNPQRTUVWXYZ";

// crypto.randomInt gives a uniform, unbiased index into the alphabet.
function pick(alphabet, length) {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += alphabet[crypto.randomInt(alphabet.length)];
  }
  return out;
}

export function generatePublicCode() {
  return pick(PUBLIC_ALPHABET, PUBLIC_LEN);
}

export function generateClaimCode() {
  // RQ-7K2M-94XD
  return `RQ-${pick(CLAIM_ALPHABET, 4)}-${pick(CLAIM_ALPHABET, 4)}`;
}

// Normalize a claim code the user typed (trim, uppercase) before comparing.
export function normalizeClaimCode(raw) {
  return String(raw || "").trim().toUpperCase();
}

export function publicUrlFor(code) {
  const base = process.env.BASE_URL || "http://localhost:5173";
  return `${base.replace(/\/$/, "")}/q/${code}`;
}
