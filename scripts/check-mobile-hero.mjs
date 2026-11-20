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
  await page.setViewport({ width: 320, height: 568 });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setRequestInterception(true);
  page.on('request', request => request.url().startsWith(base) ? request.continue() : request.abort());
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('html:not(.page-loading)');
  await page.waitForFunction(() => document.querySelector('.hero-highlight').textContent.trim() === 'Viví seguro.');
  const results = [];
  for (const [width, height] of [[320, 568], [375, 667], [390, 844], [767, 900], [768, 1024], [1440, 1000]]) {
    await page.setViewport({ width, height });
    await wait(250);
    const state = await page.evaluate(() => {
      const cta = document.querySelector('#hero .btn-get-started').getBoundingClientRect();
      return {
        chat: getComputedStyle(document.querySelector('.chat-preview')).display,
        description: getComputedStyle(document.querySelector('#hero .hero-description')).display,
        eyebrow: getComputedStyle(document.querySelector('.hero-eyebrow')).display,
        secondary: getComputedStyle(document.querySelector('.hero-secondary')).display,
        ctaVisible: cta.top >= document.querySelector('#header').offsetHeight && cta.bottom <= innerHeight,
        overflow: document.documentElement.scrollWidth > innerWidth,
        fullHeight: document.querySelector('#hero').getBoundingClientRect().bottom >= innerHeight,
        typing: document.querySelector('.chat-typing').classList.contains('is-visible'),
      };
    });
    assert(!state.overflow && state.fullHeight);
    assert.notEqual(state.description, 'none');
    assert.notEqual(state.eyebrow, 'none');
    if (width < 768) {
      assert.equal(state.chat, 'none');
      if (height < 640) assert.equal(state.secondary, 'none');
      else assert.notEqual(state.secondary, 'none');
      assert(state.ctaVisible && !state.typing);
    } else assert.equal(state.chat, 'block');
    results.push({ width, height, ...state });
    if (width === 390) await page.screenshot({ path: 'artifacts/mobile-first-hero.png' });
  }
  await page.waitForFunction(() => document.querySelector('[data-chat-message="0"]').classList.contains('is-visible'));
  await page.setViewport({ width: 390, height: 844 });
  await wait(1400);
  assert.equal(await page.$eval('.chat-typing', e => e.classList.contains('is-visible')), false);
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ results, desktopChatResumed: true, mobileChatStopped: true, errors }));
} finally { await browser.close(); }
