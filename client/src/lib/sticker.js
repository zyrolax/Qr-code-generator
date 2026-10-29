import { useEffect, useState } from "react";
import QRCode from "qrcode";

// The public URL for a sticker. We build it from the current origin so it
// matches wherever the app is served (localhost in dev, requesto.in in prod).
export function publicUrl(code) {
  return `${window.location.origin}/q/${code}`;
}

// Generates a QR data URL for a sticker's public URL. Returns "" until ready.
export function useQr(code, size = 120) {
  const [dataUrl, setDataUrl] = useState("");
  useEffect(() => {
    let active = true;
    QRCode.toDataURL(publicUrl(code), { margin: 1, width: size })
      .then((url) => active && setDataUrl(url))
      .catch(() => active && setDataUrl(""));
    return () => {
      active = false;
    };
  }, [code, size]);
  return dataUrl;
}

// Copy text to the clipboard; resolves true on success.
export async function copy(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
