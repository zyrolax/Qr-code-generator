// Upload + crop modal. The owner picks a file, frames it with react-easy-crop,
// and we render the crop to a canvas, then POST the bytes to /api/uploads. The
// server just stores the final image (no server-side processing).
import { useCallback, useEffect, useState } from "react";
import Cropper from "react-easy-crop";
import { PanelButton } from "./controls.jsx";

const ASPECTS = [
  { label: "Free", value: 0 },
  { label: "Square", value: 1 },
  { label: "4:3", value: 4 / 3 },
  { label: "3:4", value: 3 / 4 },
  { label: "16:9", value: 16 / 9 },
];

// Draw the selected crop region to a canvas and return a Blob.
async function cropToBlob(src, area) {
  const img = await loadImage(src);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(area.width);
  canvas.height = Math.round(area.height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(
    img,
    area.x, area.y, area.width, area.height,
    0, 0, area.width, area.height
  );
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not process image"))), "image/jpeg", 0.9)
  );
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load image"));
    img.src = src;
  });
}

export function ImageEditor({ onDone, onClose }) {
  const [src, setSrc] = useState(null); // object URL of the chosen file
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspect, setAspect] = useState(1);
  const [areaPixels, setAreaPixels] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Revoke the object URL when we're done with it.
  useEffect(() => () => src && URL.revokeObjectURL(src), [src]);

  function pick(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("Please choose an image file");
    if (file.size > 8 * 1024 * 1024) return setError("That image is quite large — please pick one under 8 MB");
    setError("");
    setSrc(URL.createObjectURL(file));
    setZoom(1);
    setCrop({ x: 0, y: 0 });
  }

  const onCropComplete = useCallback((_area, px) => setAreaPixels(px), []);

  async function use() {
    if (!src || !areaPixels) return;
    setBusy(true);
    setError("");
    try {
      const blob = await cropToBlob(src, areaPixels);
      const fd = new FormData();
      fd.append("image", blob, "image.jpg");
      const res = await fetch("/api/uploads", { method: "POST", body: fd, credentials: "include" });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Upload failed");
      onDone(data.url);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" onClick={onClose}>
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-panel shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-ink/10 px-5 py-3">
          <h3 className="font-semibold text-ink">Add a photo</h3>
          <button onClick={onClose} className="text-ink/40 hover:text-ink" aria-label="Close">✕</button>
        </div>

        {!src ? (
          <div className="p-8">
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-ink/20 py-12 text-center text-ink/55 transition hover:border-clay/60 hover:text-ink">
              <span className="text-3xl">🖼</span>
              <span className="font-medium">Choose an image</span>
              <span className="text-xs">JPEG, PNG, WebP or GIF · up to 4 MB saved</span>
              <input type="file" accept="image/*" className="sr-only" onChange={pick} />
            </label>
            {error && <p className="mt-3 text-center text-sm text-red-600">{error}</p>}
          </div>
        ) : (
          <>
            <div className="relative h-72 bg-ink/90">
              <Cropper
                image={src}
                crop={crop}
                zoom={zoom}
                aspect={aspect || undefined}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                restrictPosition={aspect !== 0}
              />
            </div>
            <div className="space-y-3 px-5 py-4">
              <div className="flex flex-wrap items-center gap-1.5">
                {ASPECTS.map((a) => (
                  <button
                    key={a.label}
                    type="button"
                    onClick={() => setAspect(a.value)}
                    className={`rounded-lg px-3 py-1.5 text-sm transition ${
                      aspect === a.value ? "bg-ink text-white" : "bg-white text-ink/60 hover:text-ink border border-ink/10"
                    }`}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-ink/50">Zoom</span>
                <input
                  type="range" min={1} max={3} step={0.01} value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="flex-1 accent-clay"
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex items-center justify-between gap-2">
                <PanelButton onClick={() => setSrc(null)}>Choose another</PanelButton>
                <button
                  type="button"
                  onClick={use}
                  disabled={busy}
                  className="rounded-lg bg-clay px-5 py-2 text-sm font-semibold text-white transition hover:brightness-95 disabled:opacity-50"
                >
                  {busy ? "Uploading…" : "Use photo"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
