// Optional artwork export tool. Not needed for hosting the static site.
const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
const { writeFileSync } = require('node:fs');
const path = require('node:path');
const assets = path.join(__dirname, '../dist/assets');
GlobalFonts.registerFromPath(path.join(assets, 'cormorant-regular.ttf'), 'Cormorant');
GlobalFonts.registerFromPath(path.join(assets, 'cormorant-italic.ttf'), 'Cormorant Italic');
GlobalFonts.registerFromPath(path.join(assets, 'manrope-regular.ttf'), 'Manrope');
async function render() {
  const canvas = createCanvas(1200, 630);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#faf8f3'; ctx.fillRect(0, 0, 1200, 630);
  const shade = ctx.createLinearGradient(0, 0, 450, 630);
  shade.addColorStop(0, '#faf8f3'); shade.addColorStop(1, '#eee5d6');
  ctx.fillStyle = shade; ctx.fillRect(0, 0, 550, 630);
  const photo = await loadImage(path.join(assets, 'gift-atelier.jpg'));
  const scale = Math.max(650 / photo.width, 630 / photo.height);
  const width = photo.width * scale, height = photo.height * scale;
  ctx.save(); ctx.beginPath(); ctx.rect(550, 0, 650, 630); ctx.clip();
  ctx.drawImage(photo, 550 - (width - 650) * .55, -(height - 630) / 2, width, height); ctx.restore();
  ctx.fillStyle = '#502734'; ctx.font = '13px Manrope'; ctx.fillText('M A I S O N', 54, 67);
  ctx.font = '42px Cormorant'; ctx.fillText('A U R E L L E', 52, 112);
  ctx.fillStyle = '#a58d79'; ctx.fillRect(54, 151, 40, 1);
  ctx.fillStyle = '#302c28'; ctx.font = '76px Cormorant'; ctx.fillText('Some gifts', 50, 254);
  ctx.fillText('say', 50, 332);
  ctx.fillStyle = '#502734'; ctx.font = '76px "Cormorant Italic"'; ctx.fillText('everything.', 151, 332);
  ctx.fillStyle = '#6c625a'; ctx.font = '19px Manrope';
  ctx.fillText('Thoughtful gifts.', 54, 402); ctx.fillText('Beautiful everyday luxuries.', 54, 435);
  ctx.fillStyle = '#502734'; ctx.font = '11px Manrope';
  ctx.fillText('THE ART OF GIVING / BOUTIQUE CONCEPT', 54, 581);
  writeFileSync(path.join(assets, 'maison-aurelle-share-v1.jpg'), canvas.toBuffer('image/jpeg', 90));
}
render().catch(error => { console.error(error); process.exitCode = 1; });
