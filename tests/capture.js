/**
 * 生成文档与 PPT 使用的干净截图（不修改业务数据）。
 * 运行：node tests/capture.js
 */
const path = require('path');
const fs = require('fs');
const { chromium, launchOptions } = require('./load-playwright');

const BASE = 'http://localhost:8080';
const OUT = path.join(__dirname, '..', 'docs', 'screenshots');

async function settle(page) {
  await page.evaluate(async () => {
    const step = Math.max(350, window.innerHeight * 0.7);
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise(r => setTimeout(r, 70));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(600);
  await page.evaluate(() => Array.from(document.images).filter(i => !i.complete).forEach(i => {
    // 触发最后一次解码
    i.loading = 'eager';
  }));
  await page.waitForTimeout(400);
}

async function shot(page, name, fullPage = true) {
  await page.screenshot({ path: path.join(OUT, name), fullPage, animations: 'disabled' });
  console.log('  saved', name);
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch(launchOptions());
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'zh-CN' });
  await context.addInitScript(() => {
    document.addEventListener('DOMContentLoaded', () => {
      const style = document.createElement('style');
      style.textContent = '.reveal{opacity:1!important;transform:none!important;transition:none!important}.hero-bg img{animation:none!important}';
      document.head.appendChild(style);
    });
  });
  const page = await context.newPage();
  page.on('pageerror', e => console.error('PAGE ERROR', e.message));

  await page.goto(BASE + '/index.html', { waitUntil: 'networkidle' });
  await settle(page);
  await shot(page, '01-home.png');

  await page.goto(BASE + '/products.html', { waitUntil: 'networkidle' });
  await settle(page);
  await shot(page, '02-products.png');

  await page.goto(BASE + '/orchards.html', { waitUntil: 'networkidle' });
  await settle(page);
  await shot(page, '03-orchards.png');

  await page.goto(BASE + '/orchard-detail.html?id=O001', { waitUntil: 'networkidle' });
  await settle(page);
  await shot(page, '04-orchard-detail.png');

  await page.goto(BASE + '/news.html', { waitUntil: 'networkidle' });
  await settle(page);
  await shot(page, '05-news.png');

  await page.goto(BASE + '/news-detail.html?id=N001', { waitUntil: 'networkidle' });
  await settle(page);
  await shot(page, '06-news-detail.png');

  await page.goto(BASE + '/contact.html', { waitUntil: 'networkidle' });
  await settle(page);
  await shot(page, '07-contact.png');

  await page.goto(BASE + '/login.html', { waitUntil: 'networkidle' });
  await settle(page);
  await shot(page, '08-login.png', false);

  // 普通用户登录后截个人中心
  await page.fill('#loginAccount', 'test');
  await page.fill('#loginPassword', '123456');
  await page.click('#loginForm button[type=submit]');
  await page.waitForURL('**/user.html');
  await page.waitForTimeout(500);
  await page.evaluate(() => { location.hash = '#orders'; });
  await page.waitForTimeout(500);
  await settle(page);
  await shot(page, '09-user-orders.png');

  // 购物车 / 结算
  await page.goto(BASE + '/products.html', { waitUntil: 'networkidle' });
  await page.locator('#productList .product-card [data-add-cart]').first().click();
  await page.waitForTimeout(300);
  await page.goto(BASE + '/cart.html', { waitUntil: 'networkidle' });
  await settle(page);
  await shot(page, '10-cart.png');
  await page.click('#goCheckout');
  await page.waitForURL('**/checkout.html');
  await page.waitForTimeout(500);
  await settle(page);
  await shot(page, '11-checkout.png');

  // 后台
  await page.evaluate(() => DB.logout());
  await page.goto(BASE + '/admin/login.html', { waitUntil: 'networkidle' });
  await page.fill('#adminAccount', 'admin');
  await page.fill('#adminPassword', 'admin123');
  await page.click('#adminLoginForm button[type=submit]');
  await page.waitForURL('**/admin/index.html');
  await page.waitForTimeout(800);
  await settle(page);
  await shot(page, '12-admin-dashboard.png');

  await page.goto(BASE + '/admin/orders.html', { waitUntil: 'networkidle' });
  await settle(page);
  await shot(page, '13-admin-orders.png');

  await page.goto(BASE + '/admin/products.html', { waitUntil: 'networkidle' });
  await settle(page);
  await shot(page, '14-admin-products.png');

  await page.goto(BASE + '/admin/orchards.html', { waitUntil: 'networkidle' });
  await settle(page);
  await shot(page, '15-admin-orchards.png');

  await page.goto(BASE + '/admin/messages.html', { waitUntil: 'networkidle' });
  await settle(page);
  await shot(page, '16-admin-messages.png');

  await page.goto(BASE + '/admin/settings.html', { waitUntil: 'networkidle' });
  await settle(page);
  await shot(page, '17-admin-settings.png');

  // 移动端
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(BASE + '/index.html', { waitUntil: 'networkidle' });
  await settle(page);
  await shot(page, '18-mobile-home.png', false);
  await page.goto(BASE + '/products.html', { waitUntil: 'networkidle' });
  await settle(page);
  await shot(page, '19-mobile-products.png', false);
  await page.goto(BASE + '/admin/index.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
  await shot(page, '20-mobile-admin.png', false);

  await browser.close();
  console.log('全部截图已生成到', OUT);
})();
