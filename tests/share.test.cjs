const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const dist = path.join(__dirname, '../dist');
const html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
const meta = name => html.match(new RegExp(`<meta (?:property|name)="${name}" content="([^"]+)"`))?.[1];

test('share metadata is present in HTML without JavaScript', () => {
  assert.equal(meta('og:url'), 'https://gifts-boutique.onrender.com/');
  assert.equal(meta('og:type'), 'website');
  assert.ok(meta('og:title'));
  assert.ok(meta('og:description'));
  assert.ok(meta('og:image:alt'));
  assert.equal(meta('twitter:card'), 'summary_large_image');
});

test('share image uses the live HTTPS origin and a shipped JPEG', () => {
  const url = new URL(meta('og:image'));
  assert.equal(url.origin, 'https://gifts-boutique.onrender.com');
  assert.equal(meta('twitter:image'), url.href);
  assert.equal(meta('og:image:secure_url'), url.href);
  assert.equal(meta('og:image:width'), '1200');
  assert.equal(meta('og:image:height'), '630');
  const image = fs.readFileSync(path.join(dist, url.pathname));
  assert.equal(image.readUInt16BE(0), 0xffd8);
  assert.ok(image.length < 1000000);
});
