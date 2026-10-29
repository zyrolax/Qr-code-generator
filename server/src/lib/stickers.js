import crypto from "crypto";
import bcrypt from "bcryptjs";
import Sticker from "../models/Sticker.js";
import { generatePublicCode, generateClaimCode, publicUrlFor } from "./codes.js";

// Creates N unclaimed stickers in one batch. Returns the plaintext claim codes
// alongside each created sticker — this is the ONLY moment the plaintext exists,
// so callers (seed, admin batch) must capture it here before it's lost.
export async function createStickerBatch(count) {
  const batchId = crypto.randomUUID();
  const created = [];

  for (let i = 0; i < count; i++) {
    const code = await uniquePublicCode();
    const claimCode = generateClaimCode();
    const claimCodeHash = await bcrypt.hash(claimCode, 10);

    const sticker = await Sticker.create({ code, claimCodeHash, batchId });
    created.push({ sticker, code, claimCode, url: publicUrlFor(code) });
  }

  return { batchId, items: created };
}

// Retry until we get a code that isn't already taken. Collisions are extremely
// rare with a 30^6 space, but the DB unique index is the real guarantee.
async function uniquePublicCode() {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generatePublicCode();
    const exists = await Sticker.exists({ code });
    if (!exists) return code;
  }
  throw new Error("Could not generate a unique code");
}
