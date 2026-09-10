const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

test('document previews remove legacy ellipses and highlight filled merge fields', async ({ page }) => {
  await page.goto('/login.html');
  const appCss = fs.readFileSync(path.join(__dirname, '..', 'assets', 'ecmis-app.css'), 'utf8');
  await page.evaluate(css => {
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
  }, appCss);
  await page.evaluate(() => {
    const paper = document.createElement('div');
    paper.id = 'previewFormattingProbe';
    paper.className = 'doc-paper';
    paper.style.fontFamily = 'serif';
    paper.style.fontSize = '24px';
    paper.innerHTML = `เลขที่ ............ วันที่ …………… ${ECMIS.mergeField('ข้อมูลที่กรอก')}`;
    document.body.appendChild(paper);
  });

  const paper = page.locator('#previewFormattingProbe');
  await expect(paper).not.toContainText('...');
  await expect(paper).not.toContainText('…');

  const filled = paper.locator('.mergefield.filled');
  await expect(filled).toHaveText('ข้อมูลที่กรอก');
  await expect(filled).toHaveCSS('background-color', 'rgb(220, 252, 231)');
  const typography = await paper.evaluate(el => {
    const fieldStyle = getComputedStyle(el.querySelector('.mergefield.filled'));
    const paperStyle = getComputedStyle(el);
    return {
      fieldFont: fieldStyle.fontFamily,
      paperFont: paperStyle.fontFamily,
      fieldSize: fieldStyle.fontSize,
      paperSize: paperStyle.fontSize
    };
  });
  expect(typography.fieldFont).toBe(typography.paperFont);
  expect(typography.fieldSize).toBe(typography.paperSize);

  await paper.evaluate(el => { el.innerHTML = '<div>render ใหม่ ....................</div>'; });
  await expect(paper).not.toContainText('...');
});
