import sharp from "sharp";

export async function composeBeforeAfter(leftUrl, rightUrl, {
  size = 512,
  gap = 8,
  background = "#2b2d31"
} = {}) {
  async function fetchAndFit(url) {
    if (!url) return null;
    const res = await fetch(url).catch(() => null);
    if (!res || !res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    return sharp(buf).resize(size, size, { fit: "cover" }).png().toBuffer();
  }

  let [leftBuf, rightBuf] = await Promise.all([fetchAndFit(leftUrl), fetchAndFit(rightUrl)]);
  if (!leftBuf && rightBuf) leftBuf = rightBuf;
  if (!rightBuf && leftBuf) rightBuf = leftBuf;
  if (!leftBuf && !rightBuf) return null;

  const width = size * 2 + gap;
  const height = size;

  const canvas = sharp({
    create: { width, height, channels: 4, background }
  });

  const out = await canvas
    .composite([
      { input: leftBuf,  top: 0, left: 0 },
      { input: rightBuf, top: 0, left: size + gap }
    ])
    .png()
    .toBuffer();

  return out;
}
