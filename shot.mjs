import { chromium } from 'playwright';
const [,, url, out, w = '390', h = '844', full = '1', wait = '1200'] = process.argv;
const browser = await chromium.launch({ args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: +w, height: +h }, deviceScaleFactor: 2, reducedMotion: 'reduce' });
const page = await ctx.newPage();
const errs = [];
page.on('console', (m) => m.type() === 'error' && errs.push(m.text().slice(0, 300)));
page.on('pageerror', (e) => errs.push('PAGEERROR: ' + e.message.slice(0, 300)));
await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 }).catch(e => errs.push('NAV:'+e.message.slice(0,120)));
for (let pass = 0; pass < 3; pass++) {
  try {
    const height = await page.evaluate(() => document.body.scrollHeight);
    for (let y = 0; y < height; y += Math.round(+h * 0.6)) {
      await page.evaluate((yy) => window.scrollTo(0, yy), y);
      await page.waitForTimeout(120);
    }
  } catch { await page.waitForTimeout(800); }
  await page.waitForTimeout(300);
}
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(+wait);
await page.screenshot({ path: out, fullPage: full === '1' });
console.log(errs.length ? 'ERRORS:\n' + [...new Set(errs)].join('\n') : 'no console errors');
await browser.close();
