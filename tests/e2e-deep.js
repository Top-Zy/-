/**
 * 武陵山区果园管理系统 · 深度业务流测试
 * 覆盖预约、购物车、个人资料、订单取消、后台新增/删除、留言回复、预约确认。
 */
const path = require('path');
const { chromium, launchOptions } = require('./load-playwright');

const BASE = 'http://localhost:8080';
const results = [];
function ok(n, d) { results.push([true, n, d || '']); console.log('  ✓', n, d || ''); }
function bad(n, d) { results.push([false, n, d || '']); console.error('  ✗', n, d || ''); }
function check(c, n, d) { c ? ok(n, d) : bad(n, d); }

(async () => {
  const browser = await chromium.launch(launchOptions());
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'zh-CN' });
  const page = await context.newPage();
  page.on('pageerror', e => bad('页面异常', e.message));
  page.on('console', m => { if (m.type() === 'error' && !/favicon|Failed to load resource/i.test(m.text())) bad('控制台错误', m.text()); });

  try {
    await page.goto(BASE + '/login.html', { waitUntil: 'networkidle' });
    await page.fill('#loginAccount', 'test');
    await page.fill('#loginPassword', '123456');
    await page.click('#loginForm button[type=submit]');
    await page.waitForURL('**/user.html');
    await page.waitForTimeout(400);

    // 预约
    const future = new Date(Date.now() + 4 * 86400000).toISOString().slice(0, 10);
    await page.goto(BASE + '/orchard-detail.html?id=O001', { waitUntil: 'networkidle' });
    await page.fill('#bookingName', '陈小满');
    await page.fill('#bookingPhone', '13907430001');
    await page.fill('#bookingDate', future);
    await page.fill('textarea[name=remark]', '自动化测试预约，周末上午到访。');
    await page.click('#bookingForm button[type=submit]');
    await page.waitForTimeout(500);
    check((await page.locator('#toastRoot').textContent()).includes('预约已提交'), '果园预约提交成功');
    const bookingExists = await page.evaluate(() => DB.getBookings().some(b => b.name === '陈小满' && b.remark.includes('自动化测试预约')));
    check(bookingExists, '预约数据写入本地数据库');

    // 个人中心预约列表
    await page.goto(BASE + '/user.html#bookings', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    check(await page.locator('#userBookings .order-card').count() >= 1, '个人中心显示预约记录');

    // 资料修改
    await page.goto(BASE + '/user.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(300);
    await page.fill('#profileEmailInput', 'chenxm_test@example.com');
    await page.fill('#profileAddressInput', '湖南省长沙市岳麓区测试路 100 号');
    await page.click('#profileForm button[type=submit]');
    await page.waitForTimeout(400);
    check((await page.locator('#toastRoot').textContent()).includes('个人资料已保存'), '个人资料保存成功');
    const email = await page.evaluate(() => DB.getCurrentUser().email);
    check(email === 'chenxm_test@example.com', '个人资料写入数据库');

    // 购物车数量增减与删除
    await page.goto(BASE + '/products.html', { waitUntil: 'networkidle' });
    await page.locator('#productList .product-card [data-add-cart]').nth(0).click();
    await page.waitForTimeout(200);
    await page.goto(BASE + '/cart.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(300);
    const beforeQty = parseInt(await page.locator('.cart-qty span').first().textContent(), 10);
    await page.locator('[data-cart-plus]').first().click();
    await page.waitForTimeout(250);
    const afterQty = parseInt(await page.locator('.cart-qty span').first().textContent(), 10);
    check(afterQty === beforeQty + 1, '购物车数量增加', `${beforeQty} → ${afterQty}`);
    await page.locator('[data-cart-minus]').first().click();
    await page.waitForTimeout(250);
    check(parseInt(await page.locator('.cart-qty span').first().textContent(), 10) === beforeQty, '购物车数量减少');

    // 下单后取消
    await page.click('#goCheckout');
    await page.waitForURL('**/checkout.html');
    await page.waitForTimeout(300);
    const stockBefore = await page.evaluate(() => DB.getProduct('P002') ? DB.getProduct('P002').stock : null);
    await page.fill('#checkoutAddress', '湖南省长沙市岳麓区测试路 100 号');
    await page.click('#submitOrderBtn');
    await page.waitForURL('**/order-success.html?no=*');
    await page.waitForTimeout(500);
    const no = (await page.locator('.success-order .so-row strong').first().textContent()).trim();
    await page.goto(BASE + '/user.html#orders', { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);
    const card = page.locator('#userOrders .order-card').filter({ hasText: no }).first();
    check(await card.count() === 1, '新订单出现在个人中心');
    await card.locator('[data-order-cancel]').click();
    await page.waitForTimeout(250);
    await page.locator('.modal .js-ok').click();
    await page.waitForTimeout(500);
    const cancelled = await page.evaluate(no => DB.getOrder(no).status, no);
    check(cancelled === '已取消', '用户取消订单成功');
    const stockAfter = await page.evaluate(() => DB.getProduct('P002').stock);
    check(stockAfter === stockBefore, '取消订单后库存恢复', `${stockBefore} → ${stockAfter}`);

    // 后台
    await page.evaluate(() => DB.logout());
    await page.goto(BASE + '/admin/login.html', { waitUntil: 'networkidle' });
    await page.fill('#adminAccount', 'admin');
    await page.fill('#adminPassword', 'admin123');
    await page.click('#adminLoginForm button[type=submit]');
    await page.waitForURL('**/admin/index.html');
    await page.waitForTimeout(500);

    // 新增产品
    await page.goto(BASE + '/admin/products.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(300);
    const productCountBefore = await page.evaluate(() => DB.getProducts().length);
    await page.click('#addProductBtn');
    await page.waitForTimeout(250);
    await page.fill('#productForm [name=name]', '自动化测试果');
    await page.fill('#productForm [name=price]', '19.9');
    await page.fill('#productForm [name=stock]', '66');
    await page.fill('#productForm [name=origin]', '湘西·测试产地');
    await page.click('button[form=productForm]');
    await page.waitForTimeout(500);
    const productCountAfter = await page.evaluate(() => DB.getProducts().length);
    check(productCountAfter === productCountBefore + 1, '后台新增产品成功', `${productCountBefore} → ${productCountAfter}`);
    const newProduct = await page.evaluate(() => DB.getProducts().find(p => p.name === '自动化测试果'));
    check(!!newProduct && newProduct.price === 19.9, '新增产品字段正确');
    if (newProduct) {
      await page.goto(BASE + '/admin/products.html', { waitUntil: 'networkidle' });
      await page.waitForTimeout(300);
      const row = page.locator('#productTableBody tr').filter({ hasText: '自动化测试果' }).first();
      await row.locator('[data-product-delete]').click();
      await page.waitForTimeout(250);
      await page.locator('.modal .js-ok').click();
      await page.waitForTimeout(400);
      const deleted = await page.evaluate(id => !DB.getProduct(id), newProduct.id);
      check(deleted, '后台删除产品成功');
    }

    // 留言回复
    await page.goto(BASE + '/admin/messages.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(300);
    await page.locator('#messageTableBody [data-message-view]').first().click();
    await page.waitForTimeout(250);
    await page.fill('#replyForm [name=reply]', '您好，已收到您的咨询，稍后会有客服与您联系。');
    await page.click('#saveReplyBtn');
    await page.waitForTimeout(500);
    check((await page.locator('#toastRoot').textContent()).includes('回复已保存'), '后台回复留言成功');

    // 预约确认
    await page.goto(BASE + '/admin/bookings.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(300);
    const bookingRow = page.locator('#bookingTableBody tr').filter({ hasText: '待确认' }).first();
    if (await bookingRow.count()) {
      await bookingRow.locator('[data-booking-set]').first().click();
      await page.waitForTimeout(250);
      await page.locator('.modal .js-ok').click();
      await page.waitForTimeout(400);
      check((await page.locator('#toastRoot').textContent()).includes('预约已更新'), '后台确认预约成功');
    } else ok('后台预约列表可访问（无待确认数据）');

    // 资讯新增（草稿）
    await page.goto(BASE + '/admin/news.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(300);
    await page.click('#addNewsBtn');
    await page.waitForTimeout(250);
    await page.fill('#newsForm [name=title]', '自动化测试资讯');
    await page.selectOption('#newsForm [name=status]', '草稿');
    await page.fill('#newsForm [name=content]', '这是一篇用于验证后台资讯发布功能的测试内容。\n\n## 测试小标题\n\n正文内容。');
    await page.click('button[form=newsForm]');
    await page.waitForTimeout(500);
    const newsExists = await page.evaluate(() => DB.getNews().some(n => n.title === '自动化测试资讯'));
    check(newsExists, '后台新增资讯成功');

    // 用户启停
    await page.goto(BASE + '/admin/users.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(300);
    const row = page.locator('#userTableBody tr').filter({ hasText: '陈小满' }).first();
    await row.locator('[data-user-toggle]').click();
    await page.waitForTimeout(250);
    await page.locator('.modal .js-ok').click();
    await page.waitForTimeout(400);
    const disabled = await page.evaluate(() => DB.getUsers().find(u => u.username === 'test').status);
    check(disabled === '停用', '后台停用用户成功');
    await page.evaluate(() => DB.setUserStatus('U002', '正常'));

  } catch (e) {
    bad('深度测试异常', e.message);
    try { await page.screenshot({ path: path.join(__dirname, 'screenshots', 'deep-error.png'), fullPage: true }); } catch (_) {}
  }
  await browser.close();
  const failed = results.filter(r => !r[0]);
  console.log(`\n深度测试完成：通过 ${results.length - failed.length} 项，失败 ${failed.length} 项`);
  if (failed.length) process.exit(1);
})();
