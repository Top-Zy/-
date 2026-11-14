const path = require('path');
const { chromium, launchOptions } = require('./load-playwright');
(async () => {
  const browser = await chromium.launch(launchOptions());
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 }, deviceScaleFactor: 1 });
  await page.goto('http://localhost:8080/docs/diagrams.html', { waitUntil: 'networkidle' });
  await page.locator('#architecture').screenshot({ path: path.join(__dirname, '..', 'docs', 'screenshots', 'architecture.png') });
  await page.locator('#er').screenshot({ path: path.join(__dirname, '..', 'docs', 'screenshots', 'er.png') });
  await page.locator('#order-flow').screenshot({ path: path.join(__dirname, '..', 'docs', 'screenshots', 'order-flow.png') });
  await browser.close();
  console.log('diagrams captured');
})();
