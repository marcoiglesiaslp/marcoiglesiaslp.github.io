import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { homedir } from 'node:os';
import path from 'node:path';
import { mkdir } from 'node:fs/promises';
const require = createRequire(path.resolve(process.env.FRONTEND_REFERENCE || '../altoque/apps/web/package.json'));
const puppeteer = require('puppeteer');
const base = process.env.LANDING_URL || 'http://127.0.0.1:4173';
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const browser = await puppeteer.launch({ headless: true, executablePath: process.env.CHROME_EXECUTABLE || path.join(homedir(), '.cache/puppeteer/chrome/win64-156.0.8078.47/chrome-win64/chrome.exe'), args: ['--no-sandbox', '--disable-gpu'] });
const results = { loader: false, screenshots: [], validation: [], errors: [] };
await mkdir('artifacts/refinement', { recursive: true });
async function open(width, height) {
  const page = await browser.newPage();
  page.on('pageerror', e => results.errors.push(e.message));
  await page.setViewport({ width, height });
  await page.setRequestInterception(true);
  page.on('request', r => r.url().startsWith(base) ? r.continue() : r.abort());
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('html:not(.page-loading)');
  return page;
}
try {
  const stalled = await browser.newPage();
  await stalled.setViewport({ width: 390, height: 844 });
  const held = [];
  await stalled.setRequestInterception(true);
  stalled.on('request', r => {
    if (r.url().includes('/backgrounds/')) held.push(r);
    else if (r.url().startsWith(base)) r.continue();
    else r.abort();
  });
  await stalled.goto(base, { waitUntil: 'domcontentloaded' });
  assert(await stalled.$eval('html', e => e.classList.contains('page-loading')));
  await stalled.screenshot({ path: 'artifacts/refinement/loader.png' });
  await stalled.waitForSelector('html:not(.page-loading)', { timeout: 4500 });
  results.loader = true;
  for (const request of held) await request.abort().catch(() => {});
  await stalled.close();

  const page = await open(1440, 1000);
  const entrance = await page.$eval('.hero-copy', e => ({
    fullTitle: e.querySelector('.hero-highlight').textContent.trim(),
    animation: e.getAnimations().map(a => ({ duration: a.effect.getTiming().duration, frames: a.effect.getKeyframes() })),
  }));
  assert.equal(entrance.fullTitle, 'Viví seguro.');
  assert(entrance.animation.some(a => a.duration === 750 && a.frames[0].opacity === '0'));
  assert.equal(await page.$eval('#header', e => getComputedStyle(e).backgroundColor), 'rgba(9, 28, 43, 0.34)');
  assert(await page.$eval('#header', e => e.offsetHeight < 80));
  results.hero = { fullTextEntrance: true, transparentCompactHeader: true };
  for (const [width, height, dark] of [[1440, 1000, false], [390, 844, false], [320, 568, true], [1440, 1000, true]]) {
    await page.setViewport({ width, height });
    await page.evaluate(dark => { document.documentElement.dataset.theme = dark ? 'dark' : 'light'; scrollTo({ top: 0, behavior: 'instant' }); }, dark);
    await wait(1000);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: `artifacts/refinement/${width}-${dark ? 'dark' : 'light'}-hero.png` });
    for (const section of ['#about', '#about-boxes', '#contact', '#footer']) {
      await page.$eval(section, e => scrollTo({ top: e.getBoundingClientRect().top + scrollY - document.querySelector('#header').offsetHeight, behavior: 'instant' }));
      await wait(1450);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      if (section === '#contact' && width === 1440) {
        const difference = await page.evaluate(() => Math.abs(document.querySelector('#contact .section-title .section-heading').getBoundingClientRect().top - document.querySelector('.contact-form h3').getBoundingClientRect().top));
        assert(difference <= 2, `Aligned contact headings: ${difference}px`);
        const contrast = await page.$eval('.nav-contact-cta', e => {
          const c = getComputedStyle(e);
          const luminance = color => color.match(/[\d.]+/g).slice(0, 3).map(n => Number(n) / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4).reduce((sum, v, i) => sum + v * [.2126, .7152, .0722][i], 0);
          const a = luminance(c.color), b = luminance(c.backgroundColor);
          return (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
        });
        assert(contrast >= 7, `Header contact contrast: ${contrast}`);
      }
      await page.screenshot({ path: `artifacts/refinement/${width}-${dark ? 'dark' : 'light'}-${section.slice(1)}.png` });
    }
    results.screenshots.push({ width, dark, overflow: false });
  }
  assert.equal(await page.$$('#footer .footer-top, #footer .copyright, #footer .credits').then(e => e.length), 0);
  assert.equal(await page.$$('#footer .footer-identity img').then(e => e.length), 1);
  assert.equal(await page.$$eval('#footer .social-links a', links => new Set(links.map(e => getComputedStyle(e).backgroundColor)).size), 5);
  await page.$eval('#about-boxes', e => e.scrollIntoView({ block: 'start', behavior: 'instant' }));
  await page.$eval('.coverage-more summary', e => e.click());
  await wait(100);
  const opening = await page.$eval('.coverage-answer', e => ({ height: e.getBoundingClientRect().height, full: e.scrollHeight }));
  assert(opening.height > 0 && opening.height < opening.full);
  await wait(600);
  assert(await page.$eval('.coverage-more', e => e.open));
  await page.$eval('.coverage-more summary', e => e.click());
  await wait(600);
  assert.equal(await page.$eval('.coverage-more', e => e.open), false);

  const formPage = await open(1440, 1000);
  await formPage.evaluate(() => {
    window.sentPayloads = [];
    const originalFetch = window.fetch;
    window.fetch = async (url, options) => {
      if (!String(url).startsWith('https://formspree.io/')) return originalFetch(url, options);
      window.sentPayloads.push([...options.body.entries()]);
      return new Response('{"ok":true}', { status: 200, headers: { 'Content-Type': 'application/json' } });
    };
  });
  async function fill(overrides = {}) {
    await formPage.evaluate(values => {
      for (const [name, value] of Object.entries({ name: "María O'Connor", email: 'prueba@example.com', subject: 'Automotor', message: 'Quisiera consultar por una cobertura para mi auto.', ...values })) {
        const field = document.querySelector('.contact-form').elements[name];
        field.value = value;
        field.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }, overrides);
  }
  for (const [label, fields] of [['HTML', { message: '<img src=x onerror=alert(1)>' }], ['control characters', { message: 'Consulta de prueba\u0000 con control' }], ['length', { message: 'x'.repeat(3001) }], ['header text', { email: 'test@example.com\r\nBcc: other@example.com' }], ['blank', { message: '        ' }]]) {
    await fill(fields);
    await formPage.$eval('.contact-form', f => f.requestSubmit());
    await wait(80);
    assert.equal(await formPage.evaluate(() => window.sentPayloads.length), 0, `Rejected ${label}`);
    results.validation.push(label);
  }
  await formPage.$eval('#subject', e => { const o = new Option('<script>bad</script>', '<script>bad</script>'); e.append(o); });
  await fill({ subject: '<script>bad</script>' });
  await formPage.$eval('.contact-form', f => f.requestSubmit());
  assert.equal(await formPage.evaluate(() => window.sentPayloads.length), 0);
  await formPage.evaluate(() => { const input = document.createElement('input'); input.name = 'unapproved'; input.value = '<script>bad</script>'; document.querySelector('.contact-form').append(input); });
  await fill({ message: "Me llamo O'Connor; quisiera conocer las coberturas. Muchas gracias." });
  await formPage.$eval('.contact-form', f => f.requestSubmit());
  await formPage.waitForFunction(() => document.querySelector('.form-status').dataset.state === 'success');
  const payload = await formPage.evaluate(() => window.sentPayloads[0]);
  assert.deepEqual(payload.map(([key]) => key), ['name', 'email', 'subject', 'message', '_gotcha']);
  assert.equal(payload[0][1], "María O'Connor");
  results.validation.push('allowed subjects', 'allowed text fields only', 'accents and apostrophes accepted');
  assert.deepEqual(results.errors, []);
  console.log(JSON.stringify(results));
} finally { await browser.close(); }
