import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { homedir } from 'node:os';
import path from 'node:path';
const require = createRequire(path.resolve(process.env.FRONTEND_REFERENCE || '../altoque/apps/web/package.json'));
const puppeteer = require('puppeteer');
const base = process.env.LANDING_URL || 'http://127.0.0.1:4173';
const browser = await puppeteer.launch({ headless: true, executablePath: process.env.CHROME_EXECUTABLE || path.join(homedir(), '.cache/puppeteer/chrome/win64-156.0.8078.47/chrome-win64/chrome.exe'), args: ['--no-sandbox', '--disable-gpu'] });
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1000 });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.setRequestInterception(true);
  page.on('request', r => r.url().startsWith(base) ? r.continue() : r.abort());
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('html:not(.page-loading)');
  await page.$eval('#faq', e => e.scrollIntoView({ block: 'start', behavior: 'instant' }));
  const results = [];
  for (const [width, dark] of [[1440, false], [390, true]]) {
    await page.setViewport({ width, height: 900 });
    await page.evaluate(dark => { document.documentElement.dataset.theme = dark ? 'dark' : 'light'; }, dark);
    await page.$eval('.faq-trigger', e => e.click());
    await wait(120);
    const middle = await page.$eval('#faq-list-1', e => ({ height: e.getBoundingClientRect().height, full: e.scrollHeight }));
    assert(middle.height > 0 && middle.height < middle.full, 'Opening must animate height');
    await wait(700);
    assert(await page.$eval('#faq-list-1', e => e.classList.contains('show')));
    const full = await page.$eval('#faq-list-1', e => e.getBoundingClientRect().height);
    await page.$eval('[data-bs-target="#faq-list-2"]', e => e.click());
    await wait(120);
    assert(await page.$eval('#faq-list-1', (e, full) => e.getBoundingClientRect().height < full, full));
    await wait(700);
    assert.equal(await page.$eval('#faq-list-1', e => getComputedStyle(e).display), 'none');
    assert(await page.$eval('#faq-list-2', e => e.classList.contains('show')));
    await page.$eval('[data-bs-target="#faq-list-2"]', e => e.click());
    await wait(750);
    assert.equal(await page.$eval('#faq-list-2', e => getComputedStyle(e).display), 'none');
    results.push({ width, dark, openingAnimated: true, closingAnimated: true, accordion: true });
  }
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ results, errors }));
} finally { await browser.close(); }
