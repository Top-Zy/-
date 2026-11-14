/**
 * 武陵山区果园管理系统 · Playwright 端到端冒烟测试
 * 运行：node tests/e2e.js
 */
const path = require('path');
const fs = require('fs');
const { chromium, launchOptions } = require('./load-playwright');

const BASE = 'http://localhost:8080';
const SHOT_DIR = path.join(__dirname, 'screenshots');
const errors = [];
const results = [];

function ok(name, detail) {
  results.push({ name, ok: true, detail: detail || '' });
  console.log('  ✓', name, detail || '');
}
function fail(name, detail) {
  results.push({ name, ok: false, detail: detail || '' });
  console.error('  ✗', name, detail || '');
  errors.push(name + ' ' + (detail || ''));
}
function assert(condition, name, detail) {
  if (condition) ok(name, detail);
  else fail(name, detail);
}

(async () => {
  fs.mkdirSync(SHOT_DIR, { recursive: true });
  const browser = await chromium.launch(launchOptions());
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'zh-CN' });
  const page = await context.newPage();
  page.on('pageerror', err => fail('页面脚本异常', err.message));
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (!/favicon|net::ERR|Failed to load resource/i.test(text)) fail('控制台错误', text);
    }
  });

  try {
    // 1. 首页
    await page.goto(BASE + '/index.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);
    assert((await page.title()).includes('武陵果园'), '首页标题正确');
    assert(await page.locator('h1').first().isVisible(), '首页主视觉可见');
    await page.evaluate(async () => {
      const step = Math.max(400, window.innerHeight * 0.8);
      for (let y = 0; y < document.body.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise(r => setTimeout(r, 60));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(700);
    const imgs = await page.evaluate(() => Array.from(document.images).filter(i => !i.complete || i.naturalWidth === 0).map(i => i.src));
    assert(imgs.length === 0, '首页图片全部加载', imgs.join(', '));
    assert(await page.locator('#featuredProducts .product-card').count() >= 4, '首页推荐产品渲染');
    assert(await page.locator('#featuredOrchards .orchard-card').count() === 3, '首页推荐果园渲染');
    await page.screenshot({ path: path.join(SHOT_DIR, '01-home.png'), fullPage: true });

    // 2. 产品列表 + 加购
    await page.goto(BASE + '/products.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(250);
    assert(await page.locator('#productList .product-card').count() === 8, '商城产品数量为 8');
    await page.locator('#productList .product-card [data-add-cart]').first().click();
    await page.waitForTimeout(250);
    assert((await page.locator('#cartCount').textContent()).trim() === '1', '加入购物车后角标为 1');
    await page.screenshot({ path: path.join(SHOT_DIR, '02-products.png'), fullPage: true });

    // 3. 登录
    await page.goto(BASE + '/login.html', { waitUntil: 'networkidle' });
    await page.fill('#loginAccount', 'test');
    await page.fill('#loginPassword', '123456');
    await page.click('#loginForm button[type=submit]');
    await page.waitForURL('**/user.html', { timeout: 5000 });
    await page.waitForTimeout(400);
    assert((await page.locator('#userMiniName').textContent()).includes('陈小满'), '普通用户登录成功');
    await page.screenshot({ path: path.join(SHOT_DIR, '03-user.png'), fullPage: true });

    // 4. 结算流程
    await page.goto(BASE + '/products.html', { waitUntil: 'networkidle' });
    await page.locator('#productList .product-card [data-add-cart]').nth(1).click();
    await page.goto(BASE + '/cart.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(250);
    assert(await page.locator('.cart-item').count() >= 1, '购物车商品渲染');
    await page.click('#goCheckout');
    await page.waitForURL('**/checkout.html', { timeout: 5000 });
    await page.waitForTimeout(400);
    assert((await page.inputValue('#checkoutName')).length > 0, '结算页自动填充收货人');
    const totalText = await page.locator('#checkoutTotal').textContent();
    assert(/¥\d/.test(totalText), '结算页显示应付总额', totalText);
    await page.fill('#checkoutAddress', '湖南省长沙市岳麓区麓山南路 18 号测试地址');
    await page.click('#submitOrderBtn');
    await page.waitForURL('**/order-success.html?no=*', { timeout: 6000 });
    await page.waitForTimeout(500);
    assert((await page.locator('h1').first().textContent()).includes('下单成功'), '订单提交成功页');
    const orderNo = (await page.locator('.success-order .so-row strong').first().textContent()).trim();
    assert(orderNo.startsWith('WO'), '生成订单号', orderNo);
    await page.screenshot({ path: path.join(SHOT_DIR, '04-order-success.png'), fullPage: true });

    // 5. 个人中心订单
    await page.goto(BASE + '/user.html#orders', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    assert(await page.locator('#userOrders .order-card').count() >= 1, '个人中心显示订单');
    const orderText = await page.locator('#userOrders').textContent();
    assert(orderText.includes('待发货'), '订单状态为待发货');
    await page.screenshot({ path: path.join(SHOT_DIR, '05-user-orders.png'), fullPage: true });

    // 6. 退出并测试后台权限控制
    await page.evaluate(() => { DB.logout(); });
    await page.goto(BASE + '/admin/index.html', { waitUntil: 'networkidle' });
    await page.waitForURL('**/admin/login.html?redirect=*', { timeout: 5000 });
    assert(page.url().includes('admin/login.html'), '未登录访问后台被拦截');

    // 7. 管理员登录
    await page.fill('#adminAccount', 'admin');
    await page.fill('#adminPassword', 'admin123');
    await page.click('#adminLoginForm button[type=submit]');
    await page.waitForURL('**/admin/index.html', { timeout: 5000 });
    await page.waitForTimeout(700);
    assert(await page.locator('#kpiGrid .kpi-card').count() === 4, '后台 KPI 卡片渲染');
    assert(await page.locator('#recentOrders tr').count() >= 1, '后台最新订单列表渲染');
    const canvasOk = await page.evaluate(() => {
      const c = document.getElementById('salesChart');
      return !!c && c.width > 0 && c.height > 0;
    });
    assert(canvasOk, '销售趋势 Canvas 已绘制');
    await page.screenshot({ path: path.join(SHOT_DIR, '06-admin-dashboard.png'), fullPage: true });

    // 8. 后台产品管理
    await page.goto(BASE + '/admin/products.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);
    assert(await page.locator('#productTableBody tr').count() >= 1, '后台产品表格渲染');
    await page.locator('#productTableBody [data-product-edit]').first().click();
    await page.waitForTimeout(250);
    assert(await page.locator('#productForm').isVisible(), '产品编辑弹窗打开');
    const nameVal = await page.inputValue('#productForm [name=name]');
    assert(nameVal.length > 0, '产品编辑表单回填', nameVal);
    await page.locator('#productForm [name=stock]').fill('188');
    await page.click('button[form=productForm]');
    await page.waitForTimeout(500);
    assert((await page.locator('#toastRoot').textContent()).includes('产品已更新'), '产品保存成功提示');
    await page.screenshot({ path: path.join(SHOT_DIR, '07-admin-products.png'), fullPage: true });

    // 9. 后台上架/订单页
    await page.goto(BASE + '/admin/orders.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);
    assert(await page.locator('#orderTableBody tr').count() >= 1, '后台订单表格渲染');
    await page.locator('#orderTableBody [data-order-view]').first().click();
    await page.waitForTimeout(250);
    assert(await page.locator('.modal').isVisible(), '订单详情弹窗打开');
    await page.locator('.modal .js-modal-close').first().click();
    await page.screenshot({ path: path.join(SHOT_DIR, '08-admin-orders.png'), fullPage: true });

    // 10. 后台留言/预约/设置页面可加载
    for (const [file, check] of [
      ['admin/messages.html', '#messageTableBody'],
      ['admin/bookings.html', '#bookingTableBody'],
      ['admin/users.html', '#userTableBody'],
      ['admin/news.html', '#newsTableBody'],
      ['admin/settings.html', '#settingsForm']
    ]) {
      await page.goto(BASE + '/' + file, { waitUntil: 'networkidle' });
      await page.waitForTimeout(250);
      assert(await page.locator(check).count() === 1, file + ' 正常加载');
    }
    await page.screenshot({ path: path.join(SHOT_DIR, '09-admin-settings.png'), fullPage: true });

    // 11. 前台重点页面加载
    for (const file of ['orchards.html', 'orchards.html', 'about.html', 'news.html', 'contact.html', 'cart.html']) {
      await page.goto(BASE + '/' + file, { waitUntil: 'networkidle' });
      await page.waitForTimeout(200);
      assert((await page.locator('main').count()) === 1, file + ' 正常加载');
    }
    await page.goto(BASE + '/orchards.html', { waitUntil: 'networkidle' });
    await page.locator('#orchardList .orchard-card h3 a').first().click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    assert(page.url().includes('orchard-detail.html'), '果园卡片跳转详情');
    assert(await page.locator('#bookingForm').isVisible(), '果园预约表单渲染');
    await page.screenshot({ path: path.join(SHOT_DIR, '10-orchard-detail.png'), fullPage: true });

    await page.goto(BASE + '/news.html', { waitUntil: 'networkidle' });
    await page.locator('#newsList .news-card').first().click();
    await page.waitForTimeout(500);
    assert(page.url().includes('news-detail.html'), '资讯卡片跳转详情');
    assert(await page.locator('.article-body').count() === 1, '资讯正文渲染');
    await page.screenshot({ path: path.join(SHOT_DIR, '11-news-detail.png'), fullPage: true });

    // 12. 联系留言
    await page.goto(BASE + '/contact.html', { waitUntil: 'networkidle' });
    await page.fill('#msgName', '测试同学');
    await page.fill('#msgPhone', '13800138000');
    await page.fill('#msgContent', '这是一条自动化测试留言，用于验证留言提交是否正常。');
    await page.click('#contactForm button[type=submit]');
    await page.waitForTimeout(400);
    assert((await page.locator('#toastRoot').textContent()).includes('留言已提交'), '前台留言提交成功');
    await page.screenshot({ path: path.join(SHOT_DIR, '12-contact.png'), fullPage: true });

    // 13. 移动端
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(BASE + '/index.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);
    assert(await page.locator('#mobileToggle').isVisible(), '移动端菜单按钮显示');
    await page.locator('#mobileToggle').click();
    await page.waitForTimeout(300);
    assert(await page.locator('#mobileNav').evaluate(el => el.classList.contains('open')), '移动端菜单可打开');
    await page.screenshot({ path: path.join(SHOT_DIR, '13-mobile-home.png'), fullPage: false });

  } catch (e) {
    fail('测试执行异常', e.message);
    try { await page.screenshot({ path: path.join(SHOT_DIR, 'error.png'), fullPage: true }); } catch (_) {}
  }

  await browser.close();
  const passed = results.filter(r => r.ok).length;
  const failed = results.filter(r => !r.ok).length;
  console.log(`\n测试完成：通过 ${passed} 项，失败 ${failed} 项`);
  if (failed) {
    console.log('失败项：\n' + results.filter(r => !r.ok).map(r => ' - ' + r.name + ' ' + r.detail).join('\n'));
    process.exit(1);
  }
})();
