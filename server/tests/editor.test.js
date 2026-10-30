import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { createStickerBatch } from "../src/lib/stickers.js";

const app = createApp();

async function claimedSticker(email) {
  const agent = request.agent(app);
  await agent.post("/api/auth/signup").send({ email, password: "password123" });
  const { items } = await createStickerBatch(1);
  const claim = await agent.post("/api/stickers/claim").send({ claimCode: items[0].claimCode });
  return { agent, id: claim.body.sticker._id, code: items[0].code };
}

describe("editor: styled blocks + page style", () => {
  it("persists rich style props, the contact block and page.style", async () => {
    const { agent, id, code } = await claimedSticker("editor1@test.com");

    const blocks = [
      { id: "h", type: "heading", props: { text: "Hi", font: "serif", weight: "semibold", size: "xl", align: "center", color: "#2A2824" } },
      { id: "p", type: "text", props: { text: "Body", size: "l", align: "left", leading: "relaxed", color: "" } },
      { id: "img", type: "image", props: { url: "https://example.com/a.jpg", fit: "contain", focalX: 30, focalY: 70, radius: "full" } },
      { id: "btn", type: "button", props: { label: "Go", actionType: "link", value: "https://x.com", style: "outline", color: "#9C6B4A", textColor: "#ffffff", align: "right", fullWidth: false } },
      { id: "c", type: "contact", props: { items: [{ kind: "email", label: "Mail", value: "me@x.com" }, { kind: "phone", label: "", value: "123" }] } },
      { id: "d", type: "divider", props: { variant: "dots" } },
    ];
    const style = { theme: "midnight", font: "serif", accent: "#C9A26B", background: "" };

    const ok = await agent.put(`/api/stickers/${id}/page`).send({ template: "links", blocks, style });
    expect(ok.status).toBe(200);
    expect(ok.body.sticker.page.blocks).toHaveLength(6);
    expect(ok.body.sticker.page.style.theme).toBe("midnight");

    // Public view returns the styled blocks + style verbatim.
    const view = await request(app).get(`/api/q/${code}`);
    expect(view.body.page.blocks[0].props.font).toBe("serif");
    expect(view.body.page.blocks[2].props.focalX).toBe(30);
    expect(view.body.page.blocks[4].props.items[0].kind).toBe("email");
    expect(view.body.page.style.accent).toBe("#C9A26B");
  });

  it("accepts an uploaded image path as an image url", async () => {
    const { agent, id } = await claimedSticker("editor2@test.com");
    const blocks = [{ id: "img", type: "image", props: { url: "/api/uploads/abc123.jpg" } }];
    const ok = await agent.put(`/api/stickers/${id}/page`).send({ template: "links", blocks });
    expect(ok.status).toBe(200);
    expect(ok.body.sticker.page.blocks[0].props.url).toBe("/api/uploads/abc123.jpg");
  });

  it("rejects an invalid colour and an out-of-range focal point", async () => {
    const { agent, id } = await claimedSticker("editor3@test.com");
    const badColor = await agent.put(`/api/stickers/${id}/page`).send({
      template: "links",
      blocks: [{ id: "h", type: "heading", props: { text: "x", color: "red; evil" } }],
    });
    expect(badColor.status).toBe(400);

    const badFocal = await agent.put(`/api/stickers/${id}/page`).send({
      template: "links",
      blocks: [{ id: "img", type: "image", props: { url: "", focalX: 500 } }],
    });
    expect(badFocal.status).toBe(400);
  });

  it("defaults missing style props so legacy-shaped blocks still validate", async () => {
    const { agent, id } = await claimedSticker("editor4@test.com");
    // Only the fields the old client used to send.
    const blocks = [{ id: "h", type: "heading", props: { text: "Old", align: "left" } }];
    const ok = await agent.put(`/api/stickers/${id}/page`).send({ template: "lost_found", blocks });
    expect(ok.status).toBe(200);
    const saved = ok.body.sticker.page.blocks[0].props;
    expect(saved.weight).toBe("bold"); // default filled in
    expect(saved.size).toBe("l");
  });
});

describe("editor: image upload endpoint", () => {
  // A minimal valid 1x1 PNG.
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M8AAAMBAQDJ/pLvAAAAAElFTkSuQmCC",
    "base64"
  );

  it("requires auth", async () => {
    const res = await request(app).post("/api/uploads").attach("image", png, "a.png");
    expect(res.status).toBe(401);
  });

  it("stores an image and serves it back", async () => {
    const agent = request.agent(app);
    await agent.post("/api/auth/signup").send({ email: "uploader@test.com", password: "password123" });

    const res = await agent.post("/api/uploads").attach("image", png, "a.png");
    expect(res.status).toBe(201);
    expect(res.body.url).toMatch(/^\/api\/uploads\/[\w.-]+\.png$/);

    const fetched = await request(app).get(res.body.url);
    expect(fetched.status).toBe(200);
    expect(fetched.headers["content-type"]).toContain("image/png");
  });

  it("rejects a non-image file", async () => {
    const agent = request.agent(app);
    await agent.post("/api/auth/signup").send({ email: "uploader2@test.com", password: "password123" });
    const res = await agent.post("/api/uploads").attach("image", Buffer.from("not an image"), "a.txt");
    expect(res.status).toBe(400);
  });
});
