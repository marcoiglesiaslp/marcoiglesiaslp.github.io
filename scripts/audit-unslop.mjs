import { createRequire } from 'node:module';
import { homedir } from 'node:os';
import path from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';
const require = createRequire(path.resolve('../altoque/apps/web/package.json'));
const puppeteer = require('puppeteer');
const base = 'http://127.0.0.1:4173';
const out = process.env.AUDIT_OUTPUT || 'artifacts/unslop-audit';
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
await mkdir(out, { recursive: true });
const browser = await puppeteer.launch({ headless: true, executablePath: path.join(homedir(), '.cache/puppeteer/chrome/win64-156.0.8078.47/chrome-win64/chrome.exe'), args: ['--no-sandbox', '--disable-gpu'] });
const report = { externalFontsBlocked: true, renders: [], errors: [] };
try {
  // Three page renders, as prescribed by unslop. External fonts are unavailable
  // in this environment; disclose fallback rendering rather than substituting.
  for (const [width, height, theme] of [[1440, 1000, 'light'], [1024, 768, 'dark'], [390, 844, 'light']]) {
    const page = await browser.newPage();
    page.on('pageerror', e => report.errors.push(e.message));
    await page.setViewport({ width, height });
    await page.evaluateOnNewDocument(theme => localStorage.setItem('marco-theme', theme), theme);
    await page.setRequestInterception(true);
    page.on('request', r => r.url().startsWith(base) ? r.continue() : r.abort());
    await page.goto(base, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('html:not(.page-loading)');
    await wait(1300);
    const capture = { width, height, theme, screenshots: [] };
    for (const section of ['hero', 'about', 'why-us', 'services', 'about-boxes', 'faq', 'contact', 'footer']) {
      await page.evaluate(id => {
        const target = document.getElementById(id);
        scrollTo({ top: id === 'hero' ? 0 : target.offsetTop - document.querySelector('#header').offsetHeight, behavior: 'instant' });
      }, section);
      await wait(section === 'hero' ? 100 : 1400);
      const file = `${out}/${width}-${theme}-${section}.png`;
      await page.screenshot({ path: file });
      capture.screenshots.push(file);
    }
    capture.metrics = await page.evaluate(() => {
      const normalize = text => text.replace(/\s+/g, ' ').trim();
      const selectors = ['#header .logo a', '#header .logo small', '#hero h1', '#hero .hero-description', '#why-us .section-title .section-kicker', '#why-us .section-title .section-heading', '.plan-number', '.card-title', '.card-text', '.field-hint', '.form-privacy', '.footer-legal'];
      const styles = selectors.map(selector => {
        const e = document.querySelector(selector), c = getComputedStyle(e);
        return { selector, text: normalize(e.textContent).slice(0, 95), font: c.fontFamily, size: c.fontSize, weight: c.fontWeight, tracking: c.letterSpacing, color: c.color, padding: c.padding, transform: c.textTransform };
      });
      const sectionCards = [...document.querySelectorAll('#why-us .box,#services .icon-box,#about-boxes .card')].map(e => {
        const c = getComputedStyle(e), r = e.getBoundingClientRect();
        return { section: e.closest('section').id, width: r.width, height: r.height, padding: c.padding, radius: c.borderRadius };
      });
      const css = [...document.styleSheets].filter(s => !s.href || s.href.startsWith(location.origin)).flatMap(s => {
        try { return [...s.cssRules].map(r => r.cssText); } catch { return []; }
      }).join('\n');
      const icons = [...document.querySelectorAll('i[class]')].reduce((counts, e) => {
        const set = ['bi', 'bx', 'ri'].find(prefix => [...e.classList].some(c => c === prefix || c.startsWith(`${prefix}-`)));
        if (set) counts[set] = (counts[set] || 0) + 1;
        return counts;
      }, {});
      const fonts = [...document.fonts].map(f => ({ family: f.family, weight: f.weight, status: f.status }));
      return {
        overflow: document.documentElement.scrollWidth > innerWidth,
        pageHeight: document.documentElement.scrollHeight,
        styles, sectionCards, icons, fonts,
        computedTextColors: [...new Set([...document.querySelectorAll('p,h1,h2,h3,h4,label,summary,a')].map(e => getComputedStyle(e).color))],
        importantCount: (css.match(/!important/g) || []).length,
        sectionHeadings: [...document.querySelectorAll('.section-title>.section-heading')].map(e => normalize(e.textContent)),
        heroResource: performance.getEntriesByType('resource').filter(r => r.name.includes('/backgrounds/')).map(r => ({ url: r.name, bytes: r.decodedBodySize, transfer: r.transferSize })),
        stylesheetLinks: [...document.querySelectorAll('link[rel=stylesheet]')].map(e => e.getAttribute('href')),
      };
    });
    report.renders.push(capture);
    await page.close();
  }
  await writeFile(`${out}/measurements.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ renders: report.renders.map(r => ({ width: r.width, theme: r.theme, overflow: r.metrics.overflow, pageHeight: r.metrics.pageHeight, textColors: r.metrics.computedTextColors.length, fonts: r.metrics.fonts, hero: r.metrics.heroResource })), errors: report.errors }));
} finally { await browser.close(); }
