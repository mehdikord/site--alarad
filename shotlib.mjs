import sharp from 'sharp';
const [,, src, prefix, parts='3', width='520'] = process.argv;
const m = await sharp(src).metadata();
const h = Math.ceil(m.height / +parts);
for (let i = 0; i < +parts; i++) {
  const top = i * h;
  const height = Math.min(h, m.height - top);
  if (height <= 0) break;
  await sharp(src).extract({ left: 0, top, width: m.width, height }).resize(+width).png().toFile(`${prefix}-${i}.png`);
}
console.log('sliced', m.width, m.height);
