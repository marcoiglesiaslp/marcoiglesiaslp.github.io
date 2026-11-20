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
  const results = [];
  const errors = [];
  for (const [width, section, selector, transform] of [[1440, '#about', '#about .video-box', 'scale(0.96)'], [1440, '#why-us', '#why-us .section-title', 'scale(0.96)'], [1440, '#services', '#services .icon-box', 'translateY(24px)'], [390, '#services', '#services .icon-box', 'translateY(16px)']]) {
    const page = await browser.newPage();
    await page.setViewport({ width, height: 1000 });
    page.on('pageerror', error => errors.push(error.message));
    await page.setRequestInterception(true);
    page.on('request', request => request.url().startsWith(base) ? request.continue() : request.abort());
    await page.goto(base, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('html:not(.page-loading)');
    if (section === '#about') await page.evaluate(() => {
      const number = document.querySelector('.trust-item strong');
      window.experienceValues = [];
      new MutationObserver(() => window.experienceValues.push(Number.parseInt(number.textContent))).observe(number, { childList: true, characterData: true, subtree: true });
    });
    await page.$eval(section, e => scrollTo({ top: e.getBoundingClientRect().top + scrollY - document.querySelector('#header').offsetHeight, behavior: 'instant' }));
    await page.waitForFunction(selector => document.querySelector(selector).getAnimations().some(a => a.playState === 'running'), {}, selector);
    const animation = await page.$eval(selector, e => {
      const animation = e.getAnimations().find(a => a.playState === 'running');
      return { timing: animation.effect.getTiming(), frames: animation.effect.getKeyframes(), effect: e.dataset.revealEffect };
    });
    assert.equal(animation.timing.duration, 750, `Entrance timing for ${selector}: ${JSON.stringify(animation)}`);
    assert.equal(animation.timing.easing, 'cubic-bezier(0.4, 0, 0.2, 1)');
    assert.equal(animation.frames[0].transform, transform);
    assert.equal(animation.frames[0].opacity, '0');
    if (width < 768) {
      assert.equal(animation.timing.delay, 0);
      assert.equal(await page.$eval('.chat-preview', e => getComputedStyle(e).display), 'none');
    }
    if (section === '#about') {
      await page.waitForFunction(() => document.querySelector('.trust-item strong').textContent === '28+ años');
      assert(await page.evaluate(() => window.experienceValues.some(value => value >= 0 && value < 28)), 'Experience counter should show intermediate values');
    }
    await page.waitForFunction(selector => document.querySelector(selector).dataset.scrollRevealed === 'true', {}, selector);
    await wait(50);
    assert.equal(await page.$eval(selector, e => getComputedStyle(e).opacity), '1');
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    results.push({ width, section, effect: animation.effect, duration: animation.timing.duration, delay: animation.timing.delay, complete: true });
    await page.close();
  }
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ results, errors }));
} finally { await browser.close(); }
