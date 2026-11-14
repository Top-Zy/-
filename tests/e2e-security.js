/**
 * 安全与幂等性补充测试：
 * 1. 留言内容中的脚本不会被后台执行；
 * 2. 重复提交结算请求只生成一笔订单。
 */
const { chromium, launchOptions } = require('./load-playwright');
const BASE = 'http://localhost:8080';
const results = [];
function check(c, name, detail) {
  results.push(c);
  console.log(c ? '  ✓' : '  ✗', name, detail || '');
}

(async () => {
  const browser = await chromium.launch(launchOptions());
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'zh-CN' });
  const page = await context.newPage();
  let dialogs = 0;
  page.on('dialog', async d => { dialogs++; await d.dismiss(); });
  page.on('pageerror', e => console.error('PAGE ERROR', e.message));

  await page.goto(BASE + '/contact.html', { waitUntil: 'networkidle' });
  await page.fill('#msgName', '安全测试');
  await page.fill('#msgPhone', '13800138001');
  await page.fill('#msgContent', '测试脚本转义：<script>window.__xss = 1</script> 这段文字应原样显示。');
  await page.click('#contactForm button[type=submit]');
  await page.waitForTimeout(400);

  await page.goto(BASE + '/admin/login.html', { waitUntil: 'networkidle' });
  await page.fill('#adminAccount', 'admin');
  await page.fill('#adminPassword', 'admin123');
  await page.click('#adminLoginForm button[type=submit]');
  await page.waitForURL('**/admin/index.html');
  await page.goto(BASE + '/admin/messages.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);
  const row = page.locator('#messageTableBody tr').filter({ hasText: '安全测试' }).first();
  check(await row.count() === 1, '测试留言进入后台');
  const rowText = await row.textContent();
  check(rowText.includes('<script>'), '留言内容按文本显示（HTML 被转义）');
  const xss = await page.evaluate(() => window.__xss);
  check(xss === undefined, '留言中的脚本未执行');
  check(dialogs === 0, '未触发 alert 弹窗');

  // 重复提交
  await page.evaluate(() => DB.logout());
  await page.goto(BASE + '/login.html', { waitUntil: 'networkidle' });
  await page.fill('#loginAccount', 'test');
  await page.fill('#loginPassword', '123456');
  await page.click('#loginForm button[type=submit]');
  await page.waitForURL('**/user.html');
  await page.goto(BASE + '/products.html', { waitUntil: 'networkidle' });
  await page.locator('#productList .product-card [data-add-cart]').first().click();
  await page.waitForTimeout(200);
  await page.goto(BASE + '/checkout.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);
  const before = await page.evaluate(() => DB.getOrders().length);
  await page.evaluate(() => {
    const form = document.getElementById('checkoutForm');
    form.requestSubmit();
    form.requestSubmit();
  });
  await page.waitForTimeout(800);
  const after = await page.evaluate(() => DB.getOrders().length);
  check(after === before + 1, '重复提交只生成一笔订单', `${before} → ${after}`);

  await browser.close();
  const failed = results.filter(x => !x).length;
  console.log(`\n补充安全测试：通过 ${results.length - failed} 项，失败 ${failed} 项`);
  if (failed) process.exit(1);
})();
