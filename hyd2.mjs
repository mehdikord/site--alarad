import { chromium } from 'playwright';
const browser = await chromium.launch({ args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
const page = await ctx.newPage();
const msgs = [];
page.on('pageerror', (e) => msgs.push('PAGEERROR: ' + e.message.slice(0, 3000)));
await page.goto(process.argv[2], { waitUntil: 'networkidle' });
await page.waitForTimeout(800);
const h = await page.evaluate(() => document.body.scrollHeight);
for (let y = 0; y < h; y += 500) { await page.evaluate((yy)=>window.scrollTo(0,yy), y); await page.waitForTimeout(100); }
await page.waitForTimeout(800);
console.log(msgs.length ? msgs.join('\n\n') : 'clean');
await browser.close();
