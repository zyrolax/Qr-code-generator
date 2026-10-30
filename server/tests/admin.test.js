import { describe, it, expect } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import { createApp } from "../src/app.js";
import User from "../src/models/User.js";

const app = createApp();

// Log in as a freshly-created user of the given role; returns a cookie agent.
async function agentWithRole(email, role) {
  await User.create({ email, passwordHash: await bcrypt.hash("password123", 10), role });
  const agent = request.agent(app);
  await agent.post("/api/auth/login").send({ email, password: "password123" });
  return agent;
}

describe("admin batch generation", () => {
  it("blocks non-admins", async () => {
    const user = await agentWithRole("user@test.com", "user");
    const res = await user.post("/api/admin/stickers/batch").send({ count: 3 });
    expect(res.status).toBe(403);
  });

  it("creates a batch and returns one-time claim codes", async () => {
    const admin = await agentWithRole("admin@test.com", "admin");
    const res = await admin.post("/api/admin/stickers/batch").send({ count: 3 });
    expect(res.status).toBe(201);
    expect(res.body.items).toHaveLength(3);
    for (const item of res.body.items) {
      expect(item.code).toMatch(/^[a-z0-9]{6}$/);
      expect(item.claimCode).toMatch(/^RQ-/);
      expect(item.url).toContain("/q/");
    }
  });

  it("renders the sticker-sheet PDF for a batch", async () => {
    const admin = await agentWithRole("admin2@test.com", "admin");
    const batch = await admin.post("/api/admin/stickers/batch").send({ count: 2 });
    const res = await admin
      .get(`/api/admin/stickers/batch/${batch.body.batchId}/stickers.pdf`)
      .buffer(true)
      .parse((r, cb) => {
        const chunks = [];
        r.on("data", (c) => chunks.push(c));
        r.on("end", () => cb(null, Buffer.concat(chunks)));
      });
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("application/pdf");
    // A valid PDF starts with "%PDF".
    expect(res.body.slice(0, 4).toString()).toBe("%PDF");
  });

  it("renders the customisable labels PDF from posted items + options", async () => {
    const admin = await agentWithRole("admin4@test.com", "admin");
    const res = await admin
      .post("/api/admin/stickers/batch/print.pdf")
      .send({
        items: [{ code: "abc123", claimCode: "RQ-7K2M-94XD", url: "https://test1.requesto.in/q/abc123" }],
        options: { size: "large", topText: "SCAN ME", showLogo: true, showClaim: true, accent: "#5B4BF5" },
      })
      .buffer(true)
      .parse((r, cb) => {
        const chunks = [];
        r.on("data", (c) => chunks.push(c));
        r.on("end", () => cb(null, Buffer.concat(chunks)));
      });
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("application/pdf");
    expect(res.body.slice(0, 4).toString()).toBe("%PDF");
  });

  it("rejects a bad accent colour in print options", async () => {
    const admin = await agentWithRole("admin5@test.com", "admin");
    const res = await admin.post("/api/admin/stickers/batch/print.pdf").send({
      items: [{ code: "abc123", claimCode: "RQ-7K2M-94XD", url: "https://x/q/abc123" }],
      options: { accent: "purple" },
    });
    expect(res.status).toBe(400);
  });

  it("renders the claim-cards PDF from posted items", async () => {
    const admin = await agentWithRole("admin3@test.com", "admin");
    const res = await admin
      .post("/api/admin/stickers/batch/cards.pdf")
      .send({ items: [{ code: "abc123", claimCode: "RQ-7K2M-94XD" }] })
      .buffer(true)
      .parse((r, cb) => {
        const chunks = [];
        r.on("data", (c) => chunks.push(c));
        r.on("end", () => cb(null, Buffer.concat(chunks)));
      });
    expect(res.status).toBe(200);
    expect(res.body.slice(0, 4).toString()).toBe("%PDF");
  });
});
