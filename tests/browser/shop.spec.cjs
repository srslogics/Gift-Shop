const { test, expect } = require('@playwright/test');
const KEY='maison-aurelle-concept-v1';
test('search, keyboard dialog close, bag, note and selection download',async({page})=>{
  const errors=[]; page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');
  await page.locator('#collection-search').fill('tea');
  await expect(page.locator('.product-card')).toHaveCount(1);
  const product=page.locator('.product-image-button');
  await product.focus(); await page.keyboard.press('Enter');
  await expect(page.locator('dialog')).toBeVisible();
  await page.keyboard.press('Escape'); await expect(product).toBeFocused();
  await page.locator('.quick-add[data-add="tea"]').click();
  await page.locator('#gift-note').fill('A thoughtful gift');
  await page.locator('[data-action="review"]').click();
  const downloading=page.waitForEvent('download');
  await page.locator('[data-action="download-selection"]').click();
  const download=await downloading;
  const stream=await download.createReadStream(); let body=''; for await(const chunk of stream) body+=chunk;
  expect(body).toContain('A thoughtful gift'); expect(body).toContain('not an order'); expect(errors).toEqual([]);
});
test('tabs synchronize bag and note; clearing cannot be undone by a stale favourite',async({context,page})=>{
  await page.goto('/'); const other=await context.newPage(); await other.goto('/');
  await page.locator('.quick-add[data-add="tea"]').click();
  await page.locator('#gift-note').fill('Private note');
  await expect(other.locator('.bag-count')).toHaveText('1');
  await other.locator('[data-save="amber"]').click();
  await expect(page.locator('#saved-count')).toHaveText('1');
  await page.keyboard.press('Escape');
  await page.locator('[data-action="privacy"]').click(); await page.locator('[data-action="clear-data"]').click();
  await expect(other.locator('.bag-count')).toHaveText('0');
  await other.locator('[data-save="tea"]').click();
  await expect(other.locator('[data-save="tea"]')).toHaveAttribute('aria-pressed','true');
  const stored=await other.evaluate(key=>JSON.parse(localStorage.getItem(key)),KEY);
  expect(stored.bag).toEqual([]); expect(stored.note).toBe(''); expect(stored.saved).toEqual(['tea']);
});
test('concurrent tabs serialize bag additions',async({context,page})=>{
  await page.goto('/'); const other=await context.newPage(); await other.goto('/');
  await Promise.all([page.locator('.quick-add[data-add="tea"]').click(),other.locator('[data-add="tea"]').click()]);
  await expect(page.locator('.bag-count')).toHaveText('2'); await expect(other.locator('.bag-count')).toHaveText('2');
});
test('failed deletion is visible and never claims saved data was removed',async({page})=>{
  await page.goto('/'); await page.locator('.quick-add[data-add="tea"]').click(); await page.locator('#gift-note').fill('Private');
  await page.keyboard.press('Escape');
  await page.evaluate(()=>{Storage.prototype.removeItem=()=>{throw Error('Denied');};});
  await page.locator('[data-action="privacy"]').click(); await page.locator('[data-action="clear-data"]').click();
  await expect(page.locator('.dialog-status')).toContainText('could not be cleared');
  expect(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).note,KEY)).toBe('Private');
});
test('blocked writes show a persistent warning while the bag stays usable',async({page})=>{
  await page.addInitScript(()=>{Storage.prototype.setItem=()=>{throw Error('Denied');};});
  await page.goto('/'); await page.locator('.quick-add[data-add="tea"]').click();
  await expect(page.locator('#storage-warning')).toBeVisible(); await expect(page.locator('.bag-count')).toHaveText('1');
});
test('catalogue markup stays text and dark sections have a light focus outline',async({page})=>{
  await page.goto('/');
  await page.evaluate(()=>{const p=window.Aurelle.byId('tea');p.name='<img src=x onerror="window.injected=true">';p.description='<script>window.injected=true</script>';p.image='x" onerror="window.injected=true';});
  await page.locator('[data-product="tea"]').first().click();
  await expect(page.locator('#dialog-title')).toHaveText('<img src=x onerror="window.injected=true">');
  expect(await page.evaluate(()=>window.injected)).toBeUndefined();
  await page.keyboard.press('Escape');
  await expect(page.locator('.product-image-button[data-product="tea"]')).toBeFocused();
  const button=page.locator('.bespoke button'); await button.focus();
  await page.keyboard.press('Tab'); await page.keyboard.press('Shift+Tab');
  await expect(button).toBeFocused();
  expect(await button.evaluate(el=>getComputedStyle(el).outlineColor)).toBe('rgb(250, 248, 243)');
});
test('mobile navigation focuses its destination',async({page})=>{
  await page.setViewportSize({width:390,height:844}); await page.goto('/');
  await page.locator('.mobile-menu').click(); await page.locator('.menu-list a[href="#collection"]').click();
  await expect(page.locator('#collection')).toBeFocused();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
