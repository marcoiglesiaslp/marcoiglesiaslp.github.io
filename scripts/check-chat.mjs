import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { homedir } from 'node:os';
import path from 'node:path';
const require = createRequire(path.resolve(process.env.FRONTEND_REFERENCE || '../altoque/apps/web/package.json'));
const puppeteer = require('puppeteer');
const base = process.env.LANDING_URL || 'http://127.0.0.1:4173';
const browser = await puppeteer.launch({
  headless: true,
  executablePath: process.env.CHROME_EXECUTABLE || path.join(homedir(), '.cache/puppeteer/chrome/win64-156.0.8078.47/chrome-win64/chrome.exe'),
  args: ['--no-sandbox', '--disable-gpu'],
});
try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewport({ width: 1440, height: 1000 });
  await page.setRequestInterception(true);
  page.on('request', request => request.url().startsWith(base) ? request.continue() : request.abort());
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('html:not(.page-loading)');
  assert.equal(await page.$eval('.phone-device', e => getComputedStyle(e).transform), 'none');
  await page.waitForFunction(() => document.querySelectorAll('[data-chat-message].is-visible').length === 4);
  const firstTopic = await page.$eval('.chat-preview', e => e.dataset.topic);
  const completedAt = Date.now();
  await page.waitForFunction(() => document.querySelectorAll('[data-chat-message].is-visible').length === 0, { timeout: 6500 });
  assert.notEqual(await page.$eval('.chat-preview', e => e.dataset.topic), firstTopic, 'Each loop introduces a new topic');
  const readingPause = Date.now() - completedAt;
  assert(readingPause >= 5000 && readingPause < 6500, `Five-second pause after the last bubble: ${readingPause}ms`);
  assert.equal(await page.$$eval('.chat-preview-caption span', e => e.length), 0);
  await page.waitForFunction(() => document.querySelectorAll('[data-chat-message].is-visible').length === 4);
  const topicBeforeHide = await page.$eval('.chat-preview', e => e.dataset.topic);
  const leftBeforeHide = await page.$eval('.chat-preview', e => e.getBoundingClientRect().left);
  await page.click('.chat-toggle');
  await new Promise(resolve => setTimeout(resolve, 120));
  const middleLeft = await page.$eval('.chat-preview', e => e.getBoundingClientRect().left);
  assert(middleLeft > leftBeforeHide && middleLeft < 1440 - 48, 'Slide smoothly offscreen');
  await new Promise(resolve => setTimeout(resolve, 950));
  assert.equal(await page.$eval('.chat-toggle', e => e.getAttribute('aria-expanded')), 'false');
  assert(await page.$eval('.chat-preview', e => Math.abs(innerWidth - e.getBoundingClientRect().left - 48) < 2));
  assert(await page.$eval('.chat-toggle', e => { const r = e.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth; }));
  assert(await page.$eval('.phone-device', e => e.inert));
  await new Promise(resolve => setTimeout(resolve, 1100));
  assert.equal(await page.$eval('.chat-preview', e => e.dataset.topic), topicBeforeHide);
  assert.equal(await page.$eval('.chat-typing', e => getComputedStyle(e).display), 'none');
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  // Focus stays on the same visible handle; keyboard activation restores it.
  await page.focus('.chat-toggle');
  await page.keyboard.press('Enter');
  await new Promise(resolve => setTimeout(resolve, 1000));
  assert.equal(await page.$eval('.chat-toggle', e => e.getAttribute('aria-expanded')), 'true');
  assert.equal(await page.$eval('.phone-device', e => e.inert), false);
  assert.equal(await page.$eval('.chat-preview', e => e.dataset.topic), topicBeforeHide);
  await page.waitForFunction(() => document.querySelectorAll('[data-chat-message].is-visible').length === 4);
  await page.$eval('#contact', e => e.scrollIntoView({ block: 'start', behavior: 'instant' }));
  await new Promise(resolve => setTimeout(resolve, 8500));
  assert.equal(await page.$$eval('[data-chat-message].is-visible', e => e.length), 4);
  assert.equal(await page.$eval('.chat-typing', e => getComputedStyle(e).display), 'none');
  await page.$eval('#hero', e => e.scrollIntoView({ block: 'start', behavior: 'instant' }));
  await page.waitForFunction(() => document.querySelectorAll('[data-chat-message].is-visible').length === 0);
  await page.waitForFunction(() => document.querySelectorAll('[data-chat-message].is-visible').length === 1);
  await page.setViewport({ width: 320, height: 740 });
  await new Promise(resolve => setTimeout(resolve, 150));
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ upright: true, twoCycles: true, readingPause, animatedHide: true, visibleHandle: true, keyboardRestore: true, topicPreserved: true, stopsOffscreen: true, restartsOnReturn: true, mobileOverflow: false, errors }));
} finally {
  await browser.close();
}
