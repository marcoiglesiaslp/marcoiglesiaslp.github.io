import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { homedir } from 'node:os';
import path from 'node:path';
import { mkdir } from 'node:fs/promises';
const require = createRequire(path.resolve(process.env.FRONTEND_REFERENCE || '../altoque/apps/web/package.json'));
const puppeteer = require('puppeteer');
const base = process.env.LANDING_URL || 'http://127.0.0.1:4173';
const browser = await puppeteer.launch({ headless: true, executablePath: process.env.CHROME_EXECUTABLE || path.join(homedir(), '.cache/puppeteer/chrome/win64-156.0.8078.47/chrome-win64/chrome.exe'), args: ['--no-sandbox', '--disable-gpu'] });
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
await mkdir('artifacts', { recursive: true });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1000 });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.setRequestInterception(true);
  page.on('request', r => r.url().startsWith(base) ? r.continue() : r.abort());
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('html:not(.page-loading)');
  assert.equal(await page.$eval('html', e => e.dataset.theme), 'light');
  const results = { reducedMotion: await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches), reveals: [] };
  for (const [section, card] of [['#why-us', '.box'], ['#services', '.icon-box'], ['#about-boxes', '.row>div']]) {
    const selector = `${section} ${card}`;
    await page.$eval(section, e => scrollTo({ top: e.getBoundingClientRect().top + scrollY - document.querySelector('#header').offsetHeight, behavior: 'instant' }));
    // Adjacent sections can already have entered while the preceding card animates.
    await page.waitForFunction(selector => document.querySelector(selector).dataset.scrollRevealed === 'true' || document.querySelector(selector).getAnimations().some(animation => animation.playState === 'running'), {}, selector);
    await page.waitForFunction(selector => document.querySelector(selector).dataset.scrollRevealed === 'true', {}, selector);
    assert.equal(await page.$eval(selector, e => getComputedStyle(e).opacity), '1');
    if (section !== '#about-boxes') {
      await page.hover(selector);
      await wait(650);
      assert.equal(await page.$eval(selector, e => getComputedStyle(e).backgroundColor), 'rgb(228, 241, 250)');
      await page.mouse.move(5, 5);
    }
    results.reveals.push({ section, animated: true });
  }
  await page.click('.theme-toggle');
  assert.equal(await page.$eval('html', e => e.dataset.theme), 'dark');
  assert.equal(await page.evaluate(() => localStorage.getItem('marco-theme')), 'dark');
  await page.waitForFunction(() => getComputedStyle(document.querySelector('#why-us .box')).backgroundColor === 'rgb(27, 48, 65)');
  assert.equal(await page.$eval('#why-us .box', e => getComputedStyle(e).backgroundColor), 'rgb(27, 48, 65)');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('html:not(.page-loading)');
  assert.equal(await page.$eval('html', e => e.dataset.theme), 'dark');
  await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
  await wait(900);
  await page.screenshot({ path: 'artifacts/dark-hero.png' });
  for (const width of [390, 320]) {
    await page.setViewport({ width, height: 844 });
    await wait(200);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.click('.mobile-nav-toggle');
    assert.equal(await page.$eval('.mobile-nav-toggle', e => e.getAttribute('aria-expanded')), 'true');
    await page.keyboard.press('Escape');
    await page.click('.theme-toggle');
    assert.equal(await page.$eval('html', e => e.dataset.theme), width === 390 ? 'light' : 'dark');
  }
  await page.setViewport({ width: 1440, height: 1000 });
  await page.$eval('#about-boxes', e => e.scrollIntoView({ block: 'start', behavior: 'instant' }));
  await wait(1200);
  await page.screenshot({ path: 'artifacts/dark-coverages.png' });
  await page.$eval('#why-us', e => e.scrollIntoView({ behavior: 'instant', block: 'start' }));
  await wait(1100);
  await page.hover('#why-us .box');
  await wait(650);
  assert.equal(await page.$eval('#why-us .box', e => getComputedStyle(e).backgroundColor), 'rgb(41, 77, 102)');
  assert.equal(await page.$$('#footer .footer-links').then(e => e.length), 0);
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ ...results, themePersists: true, mobileToggle: true, noOverflow: true, errors }));
} finally { await browser.close(); }
