import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { createStickerBatch } from "../src/lib/stickers.js";

const app = createApp();

// Sign up and return the session cookie supertest can reuse.
async function signupAgent(email) {
  const agent = request.agent(app);
  const res = await agent.post("/api/auth/signup").send({ email, password: "password123" });
  expect(res.status).toBe(201);
  return agent;
}

describe("claim flow", () => {
  it("claims an unclaimed sticker with the correct claim code", async () => {
    const agent = await signupAgent("owner1@test.com");
    const { items } = await createStickerBatch(1);
    const { code, claimCode } = items[0];

    const res = await agent.post("/api/stickers/claim").send({ claimCode });
    expect(res.status).toBe(200);
    expect(res.body.sticker.status).toBe("active");
    expect(res.body.sticker.template).toBe("lost_found");
    expect(res.body.sticker.code).toBe(code);
    // The claim hash must never be serialized back to the client.
    expect(res.body.sticker.claimCodeHash).toBeUndefined();
  });

  it("rejects a wrong claim code", async () => {
    const agent = await signupAgent("owner2@test.com");
    await createStickerBatch(1);

    const res = await agent.post("/api/stickers/claim").send({ claimCode: "RQ-0000-0000" });
    expect(res.status).toBe(404);
  });

  it("requires login to claim", async () => {
    const { items } = await createStickerBatch(1);
    const res = await request(app).post("/api/stickers/claim").send({ claimCode: items[0].claimCode });
    expect(res.status).toBe(401);
  });
});

describe("status + lost mode changes", () => {
  it("toggles active/paused and lost mode", async () => {
    const agent = await signupAgent("owner3@test.com");
    const { items } = await createStickerBatch(1);
    const claim = await agent.post("/api/stickers/claim").send({ claimCode: items[0].claimCode });
    const id = claim.body.sticker._id;

    const paused = await agent.patch(`/api/stickers/${id}/status`).send({ status: "paused" });
    expect(paused.status).toBe(200);
    expect(paused.body.sticker.status).toBe("paused");

    const lost = await agent.patch(`/api/stickers/${id}/lost`).send({ lost: true });
    expect(lost.status).toBe(200);
    expect(lost.body.sticker.status).toBe("lost");

    const found = await agent.patch(`/api/stickers/${id}/lost`).send({ lost: false });
    expect(found.body.sticker.status).toBe("active");
  });

  it("does not let another user change my sticker", async () => {
    const owner = await signupAgent("owner4@test.com");
    const { items } = await createStickerBatch(1);
    const claim = await owner.post("/api/stickers/claim").send({ claimCode: items[0].claimCode });
    const id = claim.body.sticker._id;

    const attacker = await signupAgent("attacker@test.com");
    const res = await attacker.patch(`/api/stickers/${id}/status`).send({ status: "paused" });
    expect(res.status).toBe(404);
  });
});

describe("finder message flow", () => {
  it("accepts a finder message on an active sticker and shows it in the owner inbox", async () => {
    const owner = await signupAgent("owner5@test.com");
    const { items } = await createStickerBatch(1);
    const claim = await owner.post("/api/stickers/claim").send({ claimCode: items[0].claimCode });
    const { code } = items[0];
    const id = claim.body.sticker._id;

    // Public page view never exposes owner contact.
    const view = await request(app).get(`/api/q/${code}`);
    expect(view.status).toBe(200);
    expect(view.body.status).toBe("active");
    expect(JSON.stringify(view.body)).not.toContain("owner5@test.com");

    // Finder posts a message (no auth).
    const msg = await request(app)
      .post(`/api/q/${code}/message`)
      .send({ foundWhere: "Canteen", body: "Found your bottle!", finderContact: "+91 90000 00000" });
    expect(msg.status).toBe(201);

    // Owner sees it in the inbox.
    const inbox = await owner.get(`/api/stickers/${id}/messages`);
    expect(inbox.status).toBe(200);
    expect(inbox.body.messages).toHaveLength(1);
    expect(inbox.body.messages[0].body).toBe("Found your bottle!");
    expect(inbox.body.messages[0].read).toBe(false);

    // Owner marks it read.
    const mid = inbox.body.messages[0]._id;
    const read = await owner.patch(`/api/messages/${mid}/read`);
    expect(read.status).toBe(200);
    expect(read.body.message.read).toBe(true);
  });

  it("includes message + unread counts in the sticker list", async () => {
    const owner = await signupAgent("owner6@test.com");
    const { items } = await createStickerBatch(1);
    const claim = await owner.post("/api/stickers/claim").send({ claimCode: items[0].claimCode });
    const { code } = items[0];
    const id = claim.body.sticker._id;

    // Two finder messages, one of which the owner reads.
    await request(app).post(`/api/q/${code}/message`).send({ body: "first" });
    await request(app).post(`/api/q/${code}/message`).send({ body: "second" });

    let list = await owner.get("/api/stickers");
    let mine = list.body.stickers.find((s) => s._id === id);
    expect(mine.messageCount).toBe(2);
    expect(mine.unreadCount).toBe(2);

    // Read one, then counts should update.
    const inbox = await owner.get(`/api/stickers/${id}/messages`);
    await owner.patch(`/api/messages/${inbox.body.messages[0]._id}/read`);

    list = await owner.get("/api/stickers");
    mine = list.body.stickers.find((s) => s._id === id);
    expect(mine.unreadCount).toBe(1);
  });

  it("saves block-based page content and rejects invalid blocks", async () => {
    const owner = await signupAgent("owner7@test.com");
    const { items } = await createStickerBatch(1);
    const claim = await owner.post("/api/stickers/claim").send({ claimCode: items[0].claimCode });
    const { code } = items[0];
    const id = claim.body.sticker._id;

    const blocks = [
      { id: "b1", type: "heading", props: { text: "Lost bottle", align: "center" } },
      { id: "b2", type: "button", props: { label: "WhatsApp", actionType: "whatsapp", value: "919000000000", style: "primary" } },
      { id: "b3", type: "finder_form", props: { heading: "Found it?" } },
    ];

    const ok = await owner.put(`/api/stickers/${id}/page`).send({ template: "lost_found", blocks });
    expect(ok.status).toBe(200);
    expect(ok.body.sticker.page.blocks).toHaveLength(3);

    // The public view returns the saved blocks.
    const view = await request(app).get(`/api/q/${code}`);
    expect(view.body.page.blocks[0].props.text).toBe("Lost bottle");

    // An unknown block type is rejected by validation.
    const bad = await owner
      .put(`/api/stickers/${id}/page`)
      .send({ template: "lost_found", blocks: [{ id: "x", type: "not_a_block", props: {} }] });
    expect(bad.status).toBe(400);
  });

  it("rejects messages on an unclaimed sticker", async () => {
    const { items } = await createStickerBatch(1);
    const res = await request(app)
      .post(`/api/q/${items[0].code}/message`)
      .send({ body: "hello" });
    expect(res.status).toBe(400);
  });
});
