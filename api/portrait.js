export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { imageBase64, mimeType } = req.body;
  if (!imageBase64) {
    return res.status(400).json({ error: "imageBase64 required" });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "OpenAI API key not configured" });
  }

  try {
    const imageBuffer = Buffer.from(imageBase64, "base64");
    const isJpeg = (mimeType || "").includes("jpeg") || (mimeType || "").includes("jpg");
    const filename = isJpeg ? "portrait.jpg" : "portrait.png";
    const contentType = isJpeg ? "image/jpeg" : "image/png";

    const formData = new FormData();
    formData.append("model", "gpt-image-1.5");
    formData.append(
      "image",
      new Blob([imageBuffer], { type: contentType }),
      filename
    );
    formData.append(
      "prompt",
      "Redraw this image as a colorful anime-style illustration, " +
        "inspired by the Pokemon animated series. " +
        "Use cel-shading, bright vibrant colors, and clean linework. " +
        "Keep the same composition, pose, and visual details."
    );
    formData.append("size", "1024x1024");

    const response = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: formData,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      const msg = err?.error?.message || "OpenAI API error";
      return res.status(502).json({ error: msg });
    }

    const data = await response.json();
    const b64 = data.data?.[0]?.b64_json;
    if (!b64) {
      return res.status(502).json({ error: "No image returned from OpenAI" });
    }

    return res.status(200).json({ portraitBase64: b64 });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Internal error" });
  }
}
