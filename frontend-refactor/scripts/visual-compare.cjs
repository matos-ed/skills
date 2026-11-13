#!/usr/bin/env node
// Captures every scenario on the "before" and "after" builds at three viewports and diffs them pixel by pixel.
// Usage: node visual-compare.cjs <scenarios.json>
// Requires `playwright` resolvable from the current directory (see SKILL.md, step 3).
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(require.resolve('playwright', { paths: [process.cwd()] }));

const VIEWPORTS = [
  { name: 'celular', viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
  { name: 'notebook', viewport: { width: 1366, height: 768 }, deviceScaleFactor: 1 },
  { name: 'desktop-fullhd', viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 },
];

const FREEZE_CSS = `*, *::before, *::after {
  animation: none !important; transition: none !important; caret-color: transparent !important;
}`;

const configPath = path.resolve(process.argv[2] || 'scenarios.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const outDir = path.resolve(path.dirname(configPath), config.out || 'visual-compare');
const tolerance = config.channelTolerance ?? 0;

async function runStep(page, step) {
  if (step.click) await page.locator(step.click).first().click();
  if (step.fill) await page.locator(step.fill.selector).first().fill(step.fill.value);
  if (step.select) await page.locator(step.select.selector).first().selectOption(step.select.value);
  if (step.waitFor) await page.locator(step.waitFor).first().waitFor({ state: 'visible' });
  if (step.waitForHidden) await page.locator(step.waitForHidden).first().waitFor({ state: 'hidden' });
  if (step.evaluate) await page.evaluate(step.evaluate);
  if (step.waitMs) await page.waitForTimeout(step.waitMs);
}

async function capture(browser, base, scenario, device, file) {
  const context = await browser.newContext({
    ...device,
    reducedMotion: 'reduce',
    locale: config.locale || 'pt-BR',
    timezoneId: config.timezoneId || 'America/Sao_Paulo',
    storageState: config.storageState ? path.resolve(path.dirname(configPath), config.storageState) : undefined,
  });
  const page = await context.newPage();
  const origin = new URL(base).origin;
  const failed = new Set();
  page.on('response', response => {
    if (response.status() >= 400 && response.url().startsWith(origin)) failed.add(`${response.status()} ${response.url()}`);
  });
  page.on('requestfailed', request => {
    if (request.url().startsWith(origin)) failed.add(`falhou ${request.url()}`);
  });
  await page.goto(new URL(scenario.path, base).toString(), { waitUntil: 'networkidle' });
  await page.addStyleTag({ content: FREEZE_CSS });
  for (const step of scenario.steps || []) await runStep(page, step);
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.fonts.ready);
  const mask = [...(config.mask || []), ...(scenario.mask || [])].map(selector => page.locator(selector));
  await page.screenshot({ path: file, fullPage: true, mask, animations: 'disabled' });
  await context.close();
  // Assets that fail on both builds (fonts, icons, images) still diff as equal, so surface them.
  for (const line of failed) console.warn(`AVISO ${path.basename(file)}: ${line}`);
}

async function diff(browser, beforeFile, afterFile, diffFile) {
  const page = await browser.newPage();
  const toDataUrl = file => `data:image/png;base64,${fs.readFileSync(file).toString('base64')}`;
  const result = await page.evaluate(
    async ({ before, after, tolerance }) => {
      const load = src => new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      });
      const [a, b] = await Promise.all([load(before), load(after)]);
      const width = Math.max(a.width, b.width);
      const height = Math.max(a.height, b.height);
      const pixels = img => {
        const canvas = new OffscreenCanvas(width, height);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        return ctx.getImageData(0, 0, width, height).data;
      };
      const pa = pixels(a);
      const pb = pixels(b);
      const out = new OffscreenCanvas(width, height);
      const octx = out.getContext('2d');
      octx.drawImage(a, 0, 0);
      octx.fillStyle = 'rgba(255,255,255,0.75)';
      octx.fillRect(0, 0, width, height);
      const overlay = octx.getImageData(0, 0, width, height);
      let changed = 0;
      for (let i = 0; i < pa.length; i += 4) {
        const delta = Math.max(
          Math.abs(pa[i] - pb[i]), Math.abs(pa[i + 1] - pb[i + 1]),
          Math.abs(pa[i + 2] - pb[i + 2]), Math.abs(pa[i + 3] - pb[i + 3]),
        );
        if (delta > tolerance) {
          changed += 1;
          overlay.data.set([255, 0, 0, 255], i);
        }
      }
      octx.putImageData(overlay, 0, 0);
      const blob = await out.convertToBlob({ type: 'image/png' });
      const bytes = new Uint8Array(await blob.arrayBuffer());
      let binary = '';
      for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
      return {
        changed,
        total: width * height,
        sameSize: a.width === b.width && a.height === b.height,
        before: `${a.width}x${a.height}`,
        after: `${b.width}x${b.height}`,
        png: btoa(binary),
      };
    },
    { before: toDataUrl(beforeFile), after: toDataUrl(afterFile), tolerance },
  );
  await page.close();
  if (result.changed > 0 || !result.sameSize) fs.writeFileSync(diffFile, Buffer.from(result.png, 'base64'));
  delete result.png;
  return result;
}

(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch();
  const rows = [];
  for (const scenario of config.scenarios) {
    for (const device of VIEWPORTS) {
      const stem = path.join(outDir, `${scenario.name}--${device.name}`);
      // Before and after back to back, so data that drifts over time drifts as little as possible between them.
      await capture(browser, config.before, scenario, device, `${stem}--before.png`);
      await capture(browser, config.after, scenario, device, `${stem}--after.png`);
      const result = await diff(browser, `${stem}--before.png`, `${stem}--after.png`, `${stem}--diff.png`);
      const identical = result.changed === 0 && result.sameSize;
      rows.push({ scenario: scenario.name, viewport: device.name, ...result, identical });
      console.log(
        `${identical ? 'IGUAL    ' : 'DIFERENTE'} ${scenario.name} @ ${device.name}: ` +
          `${result.changed} px (${((100 * result.changed) / result.total).toFixed(3)}%) ` +
          `antes ${result.before} depois ${result.after}`,
      );
    }
  }
  await browser.close();

  const lines = [
    '| Cenário | Tamanho | Resultado | Pixels diferentes | Antes | Depois |',
    '| --- | --- | --- | --- | --- | --- |',
    ...rows.map(r =>
      `| ${r.scenario} | ${r.viewport} | ${r.identical ? 'igual' : '**diferente**'} | ` +
        `${r.changed} (${((100 * r.changed) / r.total).toFixed(3)}%) | ${r.before} | ${r.after} |`,
    ),
  ];
  fs.writeFileSync(path.join(outDir, 'report.md'), `${lines.join('\n')}\n`);
  const failed = rows.filter(r => !r.identical).length;
  console.log(`\n${rows.length - failed}/${rows.length} capturas idênticas. Relatório: ${path.join(outDir, 'report.md')}`);
  process.exit(failed ? 1 : 0);
})().catch(error => {
  console.error(error);
  process.exit(2);
});
