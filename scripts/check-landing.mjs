import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import path from 'node:path';

// Reuse the browser tools already installed in the local reference project.
// No dependency on Al Toque is needed to serve or deploy the landing.
const require = createRequire(path.resolve(process.env.FRONTEND_REFERENCE || '../altoque/apps/web/package.json'));
const puppeteer = require('puppeteer');
const cache = path.join(homedir(), '.cache/puppeteer/chrome/win64-156.0.8078.47/chrome-win64/chrome.exe');
const executablePath = process.env.CHROME_EXECUTABLE || (existsSync(cache) ? cache : puppeteer.executablePath());
const base = process.env.LANDING_URL || 'http://127.0.0.1:4173';
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
await mkdir('artifacts', { recursive: true });
const browser = await puppeteer.launch({ headless: true, executablePath, args: ['--no-sandbox', '--disable-gpu'] });
const results = { viewports: [], errors: [], forms: [] };

async function pageAt(width, height, reduced = false) {
  const page = await browser.newPage();
  await page.setViewport({ width, height });
  await page.setCacheEnabled(false);
  if (reduced !== null) await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: reduced ? 'reduce' : 'no-preference' }]);
  page.on('pageerror', error => results.errors.push(error.message));
  await page.setRequestInterception(true);
  page.on('request', request => {
    if (request.url().startsWith(base)) request.continue();
    else request.abort(); // No real contact submissions or external navigation.
  });
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('html:not(.page-loading)');
  await wait(1100);
  return page;
}

try {
  // Test actual system preferences as well as explicitly emulated viewports.
  const nativePage = await pageAt(1440, 1000, null);
  const systemReducedMotion = await nativePage.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  assert.equal(await nativePage.$eval('.hero-highlight', e => e.textContent.trim()), 'Viví seguro.');
  assert.equal(await nativePage.$('.is-typing'), null);
  results.heroText = { systemReducedMotion, fullTitle: true, typewriter: false };
  await nativePage.click('#navbar a[href="#about-boxes"]');
  await wait(130);
  const intermediateScroll = await nativePage.evaluate(() => scrollY);
  const destination = await nativePage.$eval('#about-boxes', e => e.getBoundingClientRect().top + scrollY);
  assert(intermediateScroll > 0 && intermediateScroll < destination - 200, 'Animate real navigation clicks under actual system motion settings');
  await wait(1950);
  assert(await nativePage.$eval('#about-boxes', e => Math.abs(e.getBoundingClientRect().top - document.querySelector('#header').offsetHeight) < 3));
  results.navigation = { systemReducedMotion, intermediateScroll, animated: true, aligned: true };
  // A second navigation should animate from the current position as well.
  await nativePage.click('#navbar a[href="#hero"]');
  await wait(120);
  assert(await nativePage.evaluate(() => scrollY > 0));
  await wait(1950);
  assert.equal(await nativePage.evaluate(() => scrollY), 0);
  await nativePage.waitForFunction(() => document.querySelector('.hero-highlight').textContent.trim() === 'Viví seguro.');
  await nativePage.$eval('.clients', e => e.scrollIntoView({ behavior: 'instant', block: 'center' }));
  await nativePage.mouse.move(5, 5);
  await nativePage.waitForFunction(() => document.querySelector('.clients').dataset.paused === 'false');
  const logoMotion = () => nativePage.$eval('.logo-track', e => getComputedStyle(e).transform);
  const firstPosition = await logoMotion();
  await wait(350);
  assert.notEqual(await logoMotion(), firstPosition, 'Logos should move under actual system preferences');
  await nativePage.hover('.logo-marquee');
  await wait(80);
  const pausedPosition = await logoMotion();
  await wait(200);
  assert.equal(await logoMotion(), pausedPosition, 'Hover should stop the logo strip');
  await nativePage.mouse.move(5, 5);
  await wait(200);
  assert.notEqual(await logoMotion(), pausedPosition, 'Resume should restart the logo strip');
  assert.equal(await nativePage.$('.logo-toggle'), null);
  results.logos = { systemReducedMotion, moved: true, pausedOnHover: true, resumed: true, noPauseButton: true };
  await nativePage.close();
  for (const [width, height] of [[1440, 1000], [1024, 768], [768, 1024], [390, 844], [320, 740]]) {
    const page = await pageAt(width, height);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `Horizontal overflow: ${width}`);
    assert(await page.$eval('#hero', e => e.getBoundingClientRect().bottom >= innerHeight - 1), `Hero must fill the viewport: ${width}x${height}`);
    assert(await page.$eval('#about', e => e.getBoundingClientRect().top >= innerHeight - 1), `Following section should stay below the first screen: ${width}x${height}`);
    assert.equal(await page.$eval('html', e => e.lang), 'es-AR');
    assert.equal(await page.$$eval('h1', elements => elements.length), 1);
    assert.equal(await page.$$eval('.section-title>.section-heading', elements => elements.filter(e => e.tagName === 'H2').length), 6);
    assert.equal(await page.$$('#services ol.service-steps>li').then(elements => elements.length), 3);
    assert.equal(await page.$$('#faq .faq-trigger').then(elements => elements.length), 6);
    assert.equal(await page.$eval('#hero .btn-get-started', e => e.textContent.replace('↗', '').trim()), await page.$eval('#contact .contact-whatsapp', e => e.textContent.replace('↗', '').trim()));
    assert(await page.evaluate(() => {
      const agency = JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent);
      return agency['@type'] === 'InsuranceAgency' && agency.url === document.querySelector('link[rel="canonical"]').href && agency.address.addressLocality === 'City Bell' && document.querySelector('a[href*="wa.me/"]').href.includes(agency.telephone.slice(1));
    }));
    const backgroundImages = await page.evaluate(() => performance.getEntriesByType('resource').filter(r => r.name.includes('/backgrounds/')).map(r => ({ url: r.name, bytes: r.decodedBodySize })));
    assert(backgroundImages.some(r => r.url.endsWith(width < 768 ? 'hero-mobile.webp' : 'hero-desktop.webp')));
    assert(backgroundImages.every(r => !r.url.endsWith('.png') && r.bytes <= (width < 768 ? 250000 : 500000)), 'Responsive compressed hero only');
    assert.equal(await page.$eval('#header', e => getComputedStyle(e).position), 'fixed');
    assert.equal(await page.$eval('#hero', e => getComputedStyle(e, '::after').animationName), 'photo-settle');
    assert.equal(await page.$('.scroll-progress'), null);
    assert(await page.$$eval('a[href*="wa.me"]', links => links.length >= 9 && links.every(link => new URL(link.href).pathname === '/5491164221275' && new URL(link.href).searchParams.get('text'))));
    assert(await page.$$eval('a[href^="#"]', links => links.every(link => link.hash && document.getElementById(link.hash.slice(1)))));
    assert(await page.$$eval('a[target="_blank"]', links => links.every(link => link.rel.includes('noopener'))));
    assert(await page.$$eval('img', images => images.every(image => image.hasAttribute('alt'))));
    if (width < 992) {
      assert.equal(await page.$eval('#navbar ul', e => getComputedStyle(e).display), 'none');
      await page.click('.mobile-nav-toggle');
      assert.equal(await page.$eval('.mobile-nav-toggle', e => e.getAttribute('aria-expanded')), 'true');
      await page.keyboard.press('Escape');
      assert.equal(await page.$eval('#navbar ul', e => getComputedStyle(e).display), 'none');
      await page.click('.mobile-nav-toggle');
      await page.click('#navbar a[href="#about-boxes"]');
      assert.equal(await page.$eval('#navbar ul', e => getComputedStyle(e).display), 'none');
      await wait(1950);
    }
    await page.$eval('.coverage-more summary', e => e.click());
    assert(await page.$eval('.coverage-more', e => e.open));
    await page.$eval('.coverage-more summary', e => e.click());
    await page.$eval('.faq-trigger', e => e.click());
    assert.equal(await page.$('#testimonials'), null);
    assert.equal(await page.$$eval('.clients .logo-group', e => e.length), 2);
    assert.equal(await page.$('.logo-toggle'), null);
    await page.waitForFunction(() => document.querySelector('.hero-highlight').textContent.trim() === 'Viví seguro.');
    if (width === 1440) {
      await page.$eval('.hero-secondary', e => e.click());
      await wait(100);
      const earlyScroll = await page.evaluate(() => scrollY);
      const targetTop = await page.$eval('#about-boxes', e => e.getBoundingClientRect().top + scrollY);
      assert(earlyScroll > 0 && earlyScroll < targetTop - 200, 'Navigation should animate instead of jumping');
      await wait(1950);
      assert(await page.$eval('#about-boxes', e => Math.abs(e.getBoundingClientRect().top - document.querySelector('#header').offsetHeight) < 3), 'Navigation should align with header');
    }
    await page.waitForFunction(() => document.querySelector('.faq-trigger').getAttribute('aria-expanded') === 'true');
    await page.$eval('.faq-trigger', e => e.click());
    await page.$eval('[data-bs-target="#faq-list-6"]', e => e.click());
    await page.waitForFunction(() => document.querySelector('#faq-list-6').classList.contains('show'));
    assert((await page.$eval('#faq-list-6', e => e.textContent)).includes('marca, el modelo y el año'));
    await page.$eval('[data-bs-target="#faq-list-6"]', e => e.click());
    // Exercise all reveal points and lazy images before taking the full-page capture.
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 600) {
        scrollTo({ top: y, behavior: 'instant' });
        await new Promise(resolve => setTimeout(resolve, 65));
      }
      scrollTo({ top: 0, behavior: 'instant' });
    });
    await wait(800);
    const brokenImages = await page.$$eval('img', images => images.filter(image => !image.complete || !image.naturalWidth).map(image => image.getAttribute('src')));
    assert.deepEqual(brokenImages, [], `Broken image: ${width}`);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `Overflow after interactions: ${width}`);
    await page.$eval('#contact', e => scrollTo({ top: e.offsetTop - document.querySelector('#header').offsetHeight, behavior: 'instant' }));
    await wait(150);
    assert(await page.evaluate(() => {
      const back = document.querySelector('.back-to-top');
      if (innerWidth < 768) return getComputedStyle(back).display === 'none';
      const control = back.getBoundingClientRect();
      const title = document.querySelector('#contact .section-title').getBoundingClientRect();
      return control.top >= title.bottom && control.width >= 44 && control.height >= 44;
    }), `Back-to-top stays below contact heading: ${width}`);
    await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
    await page.screenshot({ path: `artifacts/${width}-hero.png` });
    if (width === 1440 || width === 390) await page.screenshot({ path: `artifacts/${width}-full.png`, fullPage: true });
    results.viewports.push({ width, height, passed: true });
    await page.close();
  }

  const page = await pageAt(390, 844, true);
  assert.equal(await page.$eval('#hero .hero-container', e => getComputedStyle(e).animationName), 'none');
  assert.equal(await page.$eval('#hero', e => getComputedStyle(e, '::after').animationName), 'none');
  assert.equal(await page.$eval('#hero h1', e => getComputedStyle(e).animationName), 'none');
  assert.equal(await page.$eval('.logo-track', e => getComputedStyle(e).animationName), 'logos-drift');
  await page.waitForFunction(() => document.querySelector('.hero-highlight').textContent.trim() === 'Viví seguro.');
  assert.equal(await page.$$('.reveal-pending').then(e => e.length), 0);
  await page.setJavaScriptEnabled(false);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('html:not(.page-loading)');
  assert.equal(await page.$eval('#navbar ul', e => getComputedStyle(e).display), 'flex');
  assert.equal(await page.$$('.reveal-pending').then(e => e.length), 0);
  await page.close();

  // Mock the provider to validate the UI without sending anyone a message.
  const formPage = await browser.newPage();
  let requests = 0;
  let pendingRequest;
  await formPage.setRequestInterception(true);
  formPage.on('request', request => {
    if (request.url().startsWith(base)) request.continue();
    else if (request.url().startsWith('https://formspree.io/')) { requests++; pendingRequest = request; }
    else request.abort();
  });
  formPage.on('pageerror', e => results.errors.push(e.message));
  await formPage.goto(base, { waitUntil: 'domcontentloaded' });
  await formPage.waitForSelector('html:not(.page-loading)');
  async function fill() {
    await formPage.evaluate(() => {
      document.querySelector('#name').value = 'Prueba local';
      document.querySelector('#email').value = 'prueba@example.com';
      document.querySelector('#subject').value = 'Automotor';
      document.querySelector('#message').value = 'Consulta de prueba, no enviar.';
    });
  }
  await fill();
  await formPage.$eval('.contact-form', form => form.requestSubmit());
  await formPage.waitForFunction(() => document.querySelector('.contact-form button').disabled);
  await formPage.$eval('.contact-form', form => form.requestSubmit());
  while (!pendingRequest) await wait(25);
  assert.equal(requests, 1, 'Duplicate form submission');
  await pendingRequest.respond({ status: 200, contentType: 'application/json', body: '{"ok":true}', headers: { 'Access-Control-Allow-Origin': '*' } });
  await formPage.waitForFunction(() => document.querySelector('.form-status').dataset.state === 'success');
  assert.equal(await formPage.$eval('#message', e => e.value), '');
  results.forms.push('success + duplicate prevention');
  pendingRequest = undefined;
  await fill();
  await formPage.$eval('.contact-form', form => form.requestSubmit());
  while (!pendingRequest) await wait(25);
  await pendingRequest.respond({ status: 500, body: 'Error', headers: { 'Access-Control-Allow-Origin': '*' } });
  await formPage.waitForFunction(() => document.querySelector('.form-status').dataset.state === 'error');
  assert.equal(await formPage.$eval('#message', e => e.value), 'Consulta de prueba, no enviar.');
  assert.equal(await formPage.$eval('.contact-form button', e => e.disabled), false);
  results.forms.push('provider failure + retained values + retry');
  await formPage.$eval('#company-website', e => { e.value = 'bot'; });
  await formPage.$eval('.contact-form', form => form.requestSubmit());
  await wait(100);
  assert.equal(requests, 2, 'Honeypot must not submit');
  results.forms.push('honeypot');
  await formPage.$eval('#company-website', e => { e.value = ''; });
  for (const [statusCode, body, expected] of [[429, '{}', 'límite'], [404, '{}', 'no está disponible'], [200, '<html>Unexpected response</html>', 'confirmar']]) {
    pendingRequest = undefined;
    await fill();
    await formPage.$eval('.contact-form', form => form.requestSubmit());
    while (!pendingRequest) await wait(25);
    await pendingRequest.respond({ status: statusCode, body, headers: { 'Access-Control-Allow-Origin': '*' } });
    await formPage.waitForFunction(() => document.querySelector('.form-status').dataset.state === 'error');
    assert((await formPage.$eval('.form-status', e => e.textContent)).includes(expected));
    assert.equal(await formPage.$eval('#message', e => e.value), 'Consulta de prueba, no enviar.');
  }
  results.forms.push('rate limit + unavailable endpoint + no false success on unexpected response');
  assert.deepEqual(results.errors, []);
  console.log(JSON.stringify(results, null, 2));
} finally {
  await writeFile('artifacts/check-results.json', JSON.stringify(results, null, 2));
  await browser.close();
}
