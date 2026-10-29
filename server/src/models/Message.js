import mongoose from "mongoose";

// A message sent by a finder to the owner of a sticker.
const messageSchema = new mongoose.Schema(
  {
    sticker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Sticker",
      required: true,
      index: true,
    },
    foundWhere: { type: String, default: "", trim: true },
    body: { type: String, required: true, trim: true },
    // The finder may optionally share a way to reach them. Always optional.
    finderContact: { type: String, default: "", trim: true },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

messageSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model("Message", messageSchema);
