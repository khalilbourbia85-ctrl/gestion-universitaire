const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  // Capture console logs and page errors
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.error('PAGE ERROR:', error.message));
  page.on('requestfailed', request => console.error('REQUEST FAILED:', request.url(), request.failure().errorText));

  await page.goto('http://localhost:5173/');

  try {
    // Wait for the username input
    await page.waitForSelector('input[placeholder="Nom d\'utilisateur"]');
    await page.type('input[placeholder="Nom d\'utilisateur"]', 'admin');
    await page.type('input[placeholder="Mot de passe"]', 'admin');
    await page.click('button[type="submit"]');

    // Wait for redirect or a few seconds
    await page.waitForTimeout(3000);
  } catch (err) {
    console.error('TEST ERROR:', err);
  }

  await browser.close();
})();
