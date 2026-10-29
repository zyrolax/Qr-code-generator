import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { connectDB } from "./db.js";
import User from "./models/User.js";
import Sticker from "./models/Sticker.js";
import Message from "./models/Message.js";
import Scan from "./models/Scan.js";
import { createStickerBatch } from "./lib/stickers.js";
import { publicUrlFor } from "./lib/codes.js";

// Wipes the DB and inserts predictable test data covering every screen state.
async function seed() {
  await connectDB();

  console.log("Clearing existing data...");
  await Promise.all([
    User.deleteMany({}),
    Sticker.deleteMany({}),
    Message.deleteMany({}),
    Scan.deleteMany({}),
  ]);

  // --- Users ---------------------------------------------------------------
  const adminPassword = "admin1234";
  const userPassword = "user1234";

  const admin = await User.create({
    email: "admin@requesto.in",
    passwordHash: await bcrypt.hash(adminPassword, 10),
    role: "admin",
  });

  const user = await User.create({
    email: "student@requesto.in",
    passwordHash: await bcrypt.hash(userPassword, 10),
    role: "user",
  });

  // --- 10 stickers in mixed states -----------------------------------------
  // createStickerBatch gives us plaintext claim codes once, which we print so
  // you can test the claim flow with a real unclaimed sticker.
  const { items } = await createStickerBatch(10);
  const stickers = items.map((i) => i.sticker);

  // [0,1] stay UNCLAIMED (test the "not set up yet" + claim flow).
  // [2..9] claimed by the normal user in various states.
  const samplePage = (title) => ({
    title,
    description: "Blue Hero water bottle with a dented cap.",
    imageUrl: "",
    note: "Thanks for finding this! Please drop it at the library front desk.",
    links: [],
  });

  // Active lost_found stickers
  for (const idx of [2, 3, 4]) {
    stickers[idx].owner = user._id;
    stickers[idx].status = "active";
    stickers[idx].template = "lost_found";
    stickers[idx].page = samplePage(`Water bottle #${idx}`);
    stickers[idx].scanCount = 3 + idx;
    await stickers[idx].save();
  }

  // A links-template sticker (portfolio use case)
  stickers[5].owner = user._id;
  stickers[5].status = "active";
  stickers[5].template = "links";
  stickers[5].page = {
    title: "Aarav's links",
    description: "CSE student • robotics club",
    imageUrl: "",
    note: "",
    links: [
      { label: "GitHub", url: "https://github.com/" },
      { label: "LinkedIn", url: "https://linkedin.com/" },
    ],
  };
  stickers[5].scanCount = 12;
  await stickers[5].save();

  // Paused sticker
  stickers[6].owner = user._id;
  stickers[6].status = "paused";
  stickers[6].template = "lost_found";
  stickers[6].page = samplePage("Calculator");
  await stickers[6].save();

  // Lost-mode stickers
  for (const idx of [7, 8]) {
    stickers[idx].owner = user._id;
    stickers[idx].status = "lost";
    stickers[idx].template = "lost_found";
    stickers[idx].page = samplePage(idx === 7 ? "Laptop charger" : "Student ID card");
    stickers[idx].scanCount = 5;
    await stickers[idx].save();
  }

  // Active sticker WITH finder messages (test the inbox)
  stickers[9].owner = user._id;
  stickers[9].status = "active";
  stickers[9].template = "lost_found";
  stickers[9].page = samplePage("Earbuds case");
  stickers[9].scanCount = 8;
  await stickers[9].save();

  await Message.create([
    {
      sticker: stickers[9]._id,
      foundWhere: "Near the canteen entrance",
      body: "Found these by the water cooler. I can drop them at the library.",
      finderContact: "+91 90000 00000",
      read: false,
    },
    {
      sticker: stickers[9]._id,
      foundWhere: "Lecture hall B",
      body: "Left it at the security desk, block B.",
      finderContact: "",
      read: true,
    },
  ]);

  // --- Print the important bits so you can log in / claim ------------------
  console.log("\n=== Seed complete ===");
  console.log("Admin login:  admin@requesto.in  /  " + adminPassword);
  console.log("User login:   student@requesto.in /  " + userPassword);
  console.log("\nUnclaimed stickers (use these to test the claim flow):");
  for (const idx of [0, 1]) {
    console.log(`  code=${items[idx].code}  claimCode=${items[idx].claimCode}`);
    console.log(`    URL: ${publicUrlFor(items[idx].code)}`);
  }
  console.log("\nA few live sticker URLs to open:");
  console.log(`  active:  ${publicUrlFor(stickers[2].code)}`);
  console.log(`  lost:    ${publicUrlFor(stickers[7].code)}`);
  console.log(`  paused:  ${publicUrlFor(stickers[6].code)}`);
  console.log(`  links:   ${publicUrlFor(stickers[5].code)}`);
  console.log("");

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
