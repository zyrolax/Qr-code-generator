import mongoose from "mongoose";

// One row per public page view. We deliberately store NO precise location —
// only a timestamp and the user agent string.
const scanSchema = new mongoose.Schema(
  {
    sticker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Sticker",
      required: true,
      index: true,
    },
    userAgent: { type: String, default: "" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default mongoose.model("Scan", scanSchema);
