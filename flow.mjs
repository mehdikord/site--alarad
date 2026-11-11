import { chromium } from 'playwright';
const browser = await chromium.launch({ args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push('PAGEERROR: ' + e.message.slice(0, 200)));
page.on('console', (m) => m.type() === 'error' && errs.push('CONSOLE: ' + m.text().slice(0, 200)));
const step = async (name) => { await page.waitForTimeout(700); await page.screenshot({ path: `/home/user/shots/flow-${name}.png` }); };

// 1. PDP
await page.goto('http://localhost:3000/product/saq-kootah-penbe-masri', { waitUntil: 'networkidle' });
await step('1-pdp');

// 2. colour switch (click 3rd swatch) then add to cart
const swatches = page.locator('button[aria-pressed]');
await swatches.nth(2).click();
await page.waitForTimeout(500);
await step('2-color');
await page.getByRole('button', { name: /افزودن به سبد/ }).first().click();
await page.waitForTimeout(1200);
await step('3-drawer');

// 3. go to checkout from drawer
await page.getByRole('link', { name: 'تکمیل خرید' }).click();
await page.waitForURL('**/checkout', { timeout: 20000 }).catch(() => errs.push('no checkout nav'));
await step('4-checkout');

// fill address
const fill = async (label, value) => {
  const el = page.getByLabel(label, { exact: false }).first();
  await el.fill(value);
};
await fill('نام و نام خانوادگی', 'سارا محمدی');
await fill('شمارهٔ همراه', '09121234567');
// province
await page.locator('select').first().selectOption({ index: 1 });
await page.waitForTimeout(400);
const selects = page.locator('select');
if ((await selects.count()) > 1) await selects.nth(1).selectOption({ index: 1 });
else await fill('شهر', 'تهران');
await fill('کد پستی', '1459873421');
await fill('نشانی کامل', 'خیابان ولیعصر، کوچه بهار، پلاک ۱۲، واحد ۳');
await step('5-address');
await page.getByRole('button', { name: /ادامه و انتخاب ارسال/ }).click();
await page.waitForTimeout(800);
await step('6-shipping');

// choose express
await page.getByRole('button', { name: /ارسال سریع تهران/ }).click();
await page.getByRole('button', { name: /ادامه به پرداخت/ }).click();
await page.waitForTimeout(800);

// coupon
await page.getByPlaceholder('کد تخفیف').first().fill('ALARAD10');
await page.getByRole('button', { name: 'اعمال' }).first().click();
await page.waitForTimeout(600);
await step('7-payment');

// card
await fill('شمارهٔ کارت', '6037991111111111');
await fill('تاریخ انقضا', '0828');
await fill('CVV2', '123');
await fill('نام صاحب کارت', 'SAHAR MOHAMMADI');
await step('8-card');
await page.getByRole('button', { name: /پرداخت/ }).last().click();
await page.waitForURL('**/checkout/success/**', { timeout: 20000 }).catch(() => errs.push('no success nav'));
await page.waitForTimeout(1600);
await step('9-success');
console.log('URL:', page.url());
console.log(errs.length ? 'ERRORS:\n' + [...new Set(errs)].join('\n') : 'no errors');
await browser.close();
